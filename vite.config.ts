import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Dev-only plugin: proxies /api/claude to Anthropic so Vite dev server works without `vercel dev`
function anthropicProxy(): Plugin {
  let apiKey = '';
  return {
    name: 'anthropic-proxy',
    configResolved(config) {
      // Load ANTHROPIC_KEY from .env.local or process.env
      const env = loadEnv(config.mode, config.root, '');
      apiKey = env.ANTHROPIC_KEY || process.env.ANTHROPIC_KEY || '';
    },
    configureServer(server) {
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
        if (!apiKey) { res.statusCode = 500; res.end(JSON.stringify({ error: { message: 'ANTHROPIC_KEY not set. Add it to .env.local' } })); return; }
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
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
    },
  };
}

export default defineConfig({
  plugins: [react(), anthropicProxy()],
  define: {
    __NARRATOR_VOICE_ID__: JSON.stringify(process.env.VITE_NARRATOR_VOICE_ID || ""),
  },
})
