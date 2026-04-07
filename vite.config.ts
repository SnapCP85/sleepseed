import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import path from 'path'
import { IncomingMessage, ServerResponse } from 'http'

// Dev-only plugin: proxies /api/* routes so Vite dev server works without `vercel dev`
function apiProxy(): Plugin {
  let apiKey = '';
  let supabaseUrl = '';
  let supabaseKey = '';
  let rootDir = '';
  return {
    name: 'api-proxy',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '');
      apiKey = env.ANTHROPIC_KEY || process.env.ANTHROPIC_KEY || '';
      supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
      supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
      rootDir = config.root;

      // Inject env vars so API route imports can access them
      process.env.ANTHROPIC_KEY = apiKey;
      process.env.VITE_SUPABASE_URL = supabaseUrl;
      process.env.SUPABASE_URL = supabaseUrl;
      process.env.VITE_SUPABASE_ANON_KEY = supabaseKey;
      // Use anon key as fallback for service role in dev
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
      }
    },
    configureServer(server) {
      // Direct Anthropic proxy for /api/claude (existing behavior)
      server.middlewares.use('/api/claude', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
        if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: { message: 'ANTHROPIC_KEY not set. Add it to .env.local' } })); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString();
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
              body,
            });
            const text = await upstream.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = upstream.status;
            res.end(text);
          } catch (e: any) {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: { message: e.message } }));
          }
        });
      });

      // Generic handler for all other /api/* routes — dynamically loads serverless functions
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/api/') || url.startsWith('/api/claude')) { next(); return; }

        // Parse route: /api/story-journeys/UUID/read → api/story-journeys/[id]/read.js
        const routePath = url.split('?')[0]; // strip query string
        const segments = routePath.replace(/^\//, '').split('/'); // ['api', 'story-journeys', 'UUID', 'read']

        // Build query params from dynamic segments
        const query: Record<string, string> = {};

        // Try to find the matching .js file
        let filePath = '';
        const tryPaths: string[] = [];

        if (segments.length === 3) {
          // /api/story-journeys/start → api/story-journeys/start.js
          tryPaths.push(path.join(rootDir, segments.join('/') + '.js'));
        } else if (segments.length === 4) {
          // /api/story-journeys/UUID/read → api/story-journeys/[id]/read.js
          query.id = segments[2];
          tryPaths.push(path.join(rootDir, segments[0], segments[1], '[id]', segments[3] + '.js'));
          // Also try /api/story-journeys/UUID → api/story-journeys/[id]/index.js
          tryPaths.push(path.join(rootDir, segments[0], segments[1], '[id]', 'index.js'));
        } else if (segments.length === 2) {
          tryPaths.push(path.join(rootDir, segments.join('/') + '.js'));
        }

        // Also handle /api/story-series/start-from-book
        // Already covered by the segments.length === 3 case

        const fs = await import('fs');
        for (const p of tryPaths) {
          if (fs.existsSync(p)) { filePath = p; break; }
        }

        if (!filePath) { next(); return; }

        // Read request body
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          try {
            const bodyStr = Buffer.concat(chunks).toString();
            let body: any = {};
            if (bodyStr) {
              try { body = JSON.parse(bodyStr); } catch { body = bodyStr; }
            }

            // Create mock req/res for the serverless handler
            const mockReq: any = {
              method: req.method,
              headers: req.headers,
              body,
              query,
              url: routePath,
            };
            const mockRes: any = {
              statusCode: 200,
              _headers: {} as Record<string, string>,
              _body: '',
              setHeader(k: string, v: string) { this._headers[k] = v; },
              status(code: number) { this.statusCode = code; return this; },
              json(data: any) {
                this._headers['Content-Type'] = 'application/json';
                this._body = JSON.stringify(data);
                return this;
              },
              send(data: any) { this._body = data; return this; },
              end(data?: any) { if (data) this._body = data; },
            };

            // Import and run the handler
            // Use file:// URL for Windows compatibility + cache busting
            const fileUrl = `file:///${filePath.replace(/\\/g, '/')}?t=${Date.now()}`;
            const mod = await import(fileUrl);
            const handler = mod.default;

            await handler(mockReq, mockRes);

            // Send response
            for (const [k, v] of Object.entries(mockRes._headers)) {
              res.setHeader(k, v as string);
            }
            res.statusCode = mockRes.statusCode;
            res.end(mockRes._body);
          } catch (e: any) {
            console.error('[api-proxy] Error:', e);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message || 'Internal dev proxy error' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiProxy()],
  define: {
    __NARRATOR_VOICE_ID__: JSON.stringify(process.env.VITE_NARRATOR_VOICE_ID || ""),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-pdf': ['jspdf'],
          'vendor-canvas': ['html2canvas'],
        },
      },
    },
  },
})
