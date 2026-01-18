import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const runtime = locals.runtime as any;
  const DB = runtime?.env?.DB;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  if (!DB) {
    return new Response(JSON.stringify({ error: 'Database not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get total count for pagination metadata
    const { results: countResults } = await DB.prepare('SELECT COUNT(*) as total FROM photos WHERE reviewed = 1').all();
    const total = countResults[0].total;

    // Get paginated results
    const { results } = await DB.prepare('SELECT * FROM photos WHERE reviewed = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all();
    
    console.log(`API /api/photos: fetched page ${page} with ${results?.length || 0} photos`);
    
    return new Response(JSON.stringify({
      data: results,
      meta: {
        total,
        page,
        limit,
        hasMore: offset + results.length < total
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
