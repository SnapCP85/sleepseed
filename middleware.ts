// Vercel Routing Middleware — gates the entire site behind a password.
// Runs at the platform edge, so it applies to every host this project serves
// (sleepseed.app, sleepseed.vercel.app, preview deployment URLs).
//
// To rotate the password without a redeploy, set SITE_PASSWORD in Vercel
// Project Settings → Environment Variables. The hardcoded fallback is used
// only if that env var is not set.
import { next } from '@vercel/functions';

const PASSWORD = process.env.SITE_PASSWORD || 'restingbitchface';
const COOKIE_NAME = 'fd_unlock';
const COOKIE_VALUE = '1';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Run on everything except the analytics beacon endpoint so visitor data still
// collects normally for the (already-unlocked) app shell.
export const config = {
  matcher: ['/((?!_vercel/insights).*)'],
};

function loginHtml(error: boolean): string {
  const errMsg = error ? 'That password isn&rsquo;t right. Try again.' : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Greg&rsquo;s Private Family Diary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,500&family=Nunito:wght@400;600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%}
    body{font-family:'Nunito',system-ui,sans-serif;background:radial-gradient(ellipse at 50% 25%,#2D1B4E 0%,#0A0718 70%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#F4EFE8;padding:24px;overflow:hidden}
    .stars{position:fixed;inset:0;pointer-events:none;opacity:.5}
    .stars i{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;box-shadow:0 0 4px #fff}
    .wrap{position:relative;max-width:440px;width:100%;text-align:center;z-index:1}
    .crest{font-size:42px;margin-bottom:14px;filter:drop-shadow(0 4px 16px rgba(245,184,76,.3))}
    h1{font-family:'Fraunces',Georgia,serif;font-size:30px;font-weight:700;letter-spacing:-.015em;margin-bottom:10px;color:#F5B84C;line-height:1.15}
    p.sub{font-size:14px;color:rgba(244,239,232,.6);margin-bottom:34px;font-style:italic;letter-spacing:.01em;font-family:'Fraunces',Georgia,serif}
    form{display:flex;flex-direction:column;gap:12px}
    input[type=password]{padding:14px 16px;font-size:16px;background:rgba(255,255,255,.05);border:1px solid rgba(245,184,76,.28);border-radius:10px;color:#F4EFE8;font-family:inherit;outline:none;transition:border-color .2s,background .2s;text-align:center;letter-spacing:.05em}
    input[type=password]:focus{border-color:#F5B84C;background:rgba(255,255,255,.08)}
    input[type=password]::placeholder{color:rgba(244,239,232,.35);letter-spacing:.02em}
    button{padding:14px 16px;font-size:15px;font-weight:600;background:#F5B84C;color:#1a0f08;border:none;border-radius:10px;cursor:pointer;font-family:inherit;transition:background .2s,transform .1s;letter-spacing:.02em}
    button:hover{background:#F5C060}
    button:active{transform:translateY(1px)}
    .err{color:#e8836a;font-size:13px;margin-top:4px;min-height:18px;font-style:italic;font-family:'Fraunces',Georgia,serif}
    footer{margin-top:40px;font-size:11px;color:rgba(244,239,232,.28);letter-spacing:.12em;text-transform:uppercase}
  </style>
</head>
<body>
  <div class="stars" aria-hidden="true">
    <i style="top:8%;left:12%"></i><i style="top:14%;left:78%"></i><i style="top:22%;left:34%"></i>
    <i style="top:30%;left:88%;width:3px;height:3px"></i><i style="top:48%;left:7%"></i>
    <i style="top:62%;left:82%"></i><i style="top:74%;left:22%"></i><i style="top:86%;left:64%"></i>
    <i style="top:18%;left:54%;width:1px;height:1px;opacity:.6"></i>
    <i style="top:54%;left:44%;width:1px;height:1px;opacity:.5"></i>
  </div>
  <div class="wrap">
    <div class="crest">📖</div>
    <h1>Greg&rsquo;s Private Family Diary</h1>
    <p class="sub">For invited eyes only.</p>
    <form method="POST" action="/__unlock">
      <input type="password" name="p" placeholder="Password" autofocus required autocomplete="current-password">
      <button type="submit">Enter</button>
      <div class="err">${errMsg}</div>
    </form>
    <footer>Private</footer>
  </div>
</body>
</html>`;
}

function htmlResponse(html: string, status: number): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function isAuthed(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  return cookie
    .split(/;\s*/)
    .some(c => c === `${COOKIE_NAME}=${COOKIE_VALUE}`);
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Password submission
  if (request.method === 'POST' && url.pathname === '/__unlock') {
    const body = await request.text();
    const entered = new URLSearchParams(body).get('p') || '';
    if (entered === PASSWORD) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    return htmlResponse(loginHtml(true), 401);
  }

  // Already unlocked → pass through to the app
  if (isAuthed(request)) {
    return next();
  }

  // Anything else → show the locked landing page
  return htmlResponse(loginHtml(false), 200);
}
