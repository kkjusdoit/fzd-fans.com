import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, locals } = context;
  const path = new URL(url).pathname;

  // Protect /admin routes and /api/sync routes
  if (path.startsWith('/admin') || path.startsWith('/api/sync')) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

    if (!authHeader) {
      console.log(`[Auth] Missing Authorization header for ${path}`);
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"'
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
      const validUser = env.BASIC_USER || 'kkjusdoit';
      const validPass = env.BASIC_PASS || 'fzd-fans.com';

      if (user === validUser && pass === validPass) {
        return next();
      } else {
        console.warn(`[Auth] Failed login attempt. User: ${user}, Expected: ${validUser}`);
        return new Response('Forbidden', {
          status: 403,
          headers: {
            'WWW-Authenticate': 'Basic realm="Admin Access"'
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
