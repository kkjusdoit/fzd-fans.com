import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, locals } = context;
  const path = new URL(url).pathname;

  // Protect /admin routes and /api/sync routes
  if (path.startsWith('/admin') || path.startsWith('/api/sync')) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

    if (!authHeader) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"'
        }
      });
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    // Get credentials from env or fallback (matching user provided screenshots)
    const runtime = locals.runtime as any;
    const env = runtime?.env || {};
    
    // Fallback based on user conversations if environment variable is missing in dev
    const validUser = env.BASIC_USER || 'kkjusdoit';
    const validPass = env.BASIC_PASS || 'fzd-fans.com';

    if (user === validUser && pass === validPass) {
      return next();
    } else {
      return new Response('Forbidden', {
        status: 403,
         headers: {
          'WWW-Authenticate': 'Basic realm="Admin Access"'
        }
      });
    }
  }

  return next();
});
