import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');
    const filename = url.searchParams.get('filename') || 'download.jpg';

    if (!imageUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Validate URL (optional but good for security)
    try {
        new URL(imageUrl);
    } catch {
        return new Response('Invalid URL', { status: 400 });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return new Response(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    // Get the image blob
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the response with proper headers for download
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
