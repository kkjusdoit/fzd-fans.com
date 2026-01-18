import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, locals } = context;
  const path = new URL(url).pathname;

  // Protect /admin routes (excluding sync which is now public per request)
  // path.startsWith('/api/sync') is also excluded now
  if (path.startsWith('/admin') && !path.includes('/sync')) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

    if (!authHeader) {
      console.log(`[Auth] Missing Authorization header for ${path}`);
      if (import.meta.env.DEV) {
        console.log('[Auth] Development mode hint: Use kkjusdoit / fzd-fans.com');
      }
      return new Response(`
        <html>
          <head>
            <title>Unauthorized</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; color: #333; }
              .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              h1 { margin: 0 0 1rem; color: #d32f2f; font-size: 1.5rem; }
              p { margin-bottom: 1.5rem; line-height: 1.5; }
              .debug { font-size: 0.8rem; color: #666; background: #eee; padding: 0.5rem; border-radius: 4px; margin-bottom: 1rem; font-family: monospace; }
              button { background: #1976d2; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 4px; font-size: 1rem; cursor: pointer; }
              button:hover { background: #1565c0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⚠️ Unauthorized</h1>
              <p>The server requires authentication but did not receive valid credentials.</p>
              <div class="debug">Debug: Authorization header was missing.</div>
              <button onclick="window.location.reload()">Login</button>
            </div>
          </body>
        </html>`, {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"',
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

    try {
      const authValue = authHeader.split(' ')[1];
      if (!authValue) throw new Error('Invalid Auth Header');

      // Compatible decoding for both Node (dev) and Workers (prod)
      const decoded = typeof atob === 'function' 
        ? atob(authValue) 
        : Buffer.from(authValue, 'base64').toString();
        
      const [user, ...passParts] = decoded.split(':');
      const pass = passParts.join(':'); // Handle passwords containing colons

      // Get credentials from env or fallback (matching user provided screenshots)
      const runtime = (locals as any).runtime;
      const env = runtime?.env || {};
      
      // Fallback based on user conversations if environment variable is missing in dev
      const validUser = env.BASIC_USER || import.meta.env.BASIC_USER || 'kkjusdoit';
      const validPass = env.BASIC_PASS || import.meta.env.BASIC_PASS || 'fzd-fans.com';

      if (user === validUser && pass === validPass) {
        return next();
      } else {
        console.warn(`[Auth] Failed login attempt.`);
        console.warn(`[Auth] Received User: '${user}' (Length: ${user.length})`);
        console.warn(`[Auth] Expected User: '${validUser}' (Length: ${validUser.length})`);
        console.warn(`[Auth] Received Pass: '${pass}' (Length: ${pass.length})`);
        console.warn(`[Auth] Expected Pass: '${validPass}' (Length: ${validPass.length})`);

        return new Response(`
          <html>
            <head><title>Forbidden</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: red;">403 Forbidden - Auth Failed</h1>
              <div style="background: #eee; padding: 20px; text-align: left; display: inline-block; border-radius: 8px;">
                <p><strong>Debug Info:</strong></p>
                <p>Received User: <code>${user}</code></p>
                <p>Expected User: <code>${validUser}</code></p>
                <p>Received Pass: <code>${pass}</code></p>
                <p>Expected Pass: <code>${validPass.substring(0, 3)}***</code> (Check console for full)</p>
                <hr/>
                <p><strong>Troubleshooting:</strong></p>
                <ul>
                  <li>Check your <code>.env</code> file or Cloudflare variables.</li>
                  <li>Ensure no extra spaces in credentials.</li>
                  <li>Try clearing browser cache/cookies for this site.</li>
                </ul>
              </div>
              <br/><br/>
              <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px;">Retry Login</button>
            </body>
          </html>`, {
          status: 403,
          headers: {
            // 'WWW-Authenticate': 'Basic realm="Admin Access"', // Removed to stop browser popup loop
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }
    } catch (e) {
      console.error('[Auth] Error processing credentials:', e);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return next();
});
