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
    
    // Runtime Accessibility Check (Parallel)
    // [FIX] Disabled strict server-side check because it causes false negatives (e.g. 302 redirects, firewall blocks).
    // We trust the DB records and let the client browser attempt to load the images.
    const validResults = results; // Skip check: const checkedResults = await Promise.all(...)
    
    /* 
    const invalidIds: number[] = [];
    const checkedResults = await Promise.all(
      (results || []).map(async (photo: any) => {
        try {
          // Use redirect: 'manual' to catch 302 redirects (block pages) as non-200
          const res = await fetch(photo.url, { method: 'HEAD', redirect: 'manual' });
          if (res.status === 200) {
            return photo;
          } else {
             invalidIds.push(photo.id);
             return null;
          }
        } catch (e) {
          console.warn(`API: Accessibility check failed for ${photo.url}`, e);
          invalidIds.push(photo.id);
          return null;
        }
      })
    );
    */
    
    // Update invalid photos in DB so they don't count next time
    // We set reviewed = 2 (or 0) to hide them.
    // [FIX] Commented out to prevent pagination holes (skipping valid photos) when offset shifts
    /*
    if (invalidIds.length > 0) {
       // ... existing commented code ...
    }
    */
    
    // const validResults = checkedResults.filter((p: any) => p !== null);
    
    // Adjust total to reflect the invalid items found on this page
    const adjustedTotal = total; // Math.max(0, total - invalidIds.length);

    console.log(`API /api/photos: fetched page ${page} with ${results?.length || 0} photos, returning ${validResults.length} accessible. Total adjusted from ${total} to ${adjustedTotal}`);
    
    return new Response(JSON.stringify({
      data: validResults,
      meta: {
        total: adjustedTotal,
        page,
        limit,
        // Update hasMore logic slightly since we might have filtered some out, 
        // but generally relies on DB offset. 
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
