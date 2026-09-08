import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const runtime = (locals as any).runtime;
  const R2 = runtime?.env?.R2;

  const key = params.key;
  if (!key) {
    return new Response('Not Found', { status: 404 });
  }

  if (!R2) {
    return new Response('R2 Storage Not Initialized', { status: 500 });
  }

  try {
    const object = await R2.get(key);
    if (!object) {
      return new Response('Object Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    if (!headers.has('content-type')) {
      // 简单根据后缀猜测
      const ext = key.split('.').pop()?.toLowerCase();
      if (ext === 'png') headers.set('content-type', 'image/png');
      else if (ext === 'webp') headers.set('content-type', 'image/webp');
      else if (ext === 'gif') headers.set('content-type', 'image/gif');
      else if (ext === 'svg') headers.set('content-type', 'image/svg+xml');
      else headers.set('content-type', 'image/jpeg');
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (err: any) {
    console.error('R2 get media error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
};
