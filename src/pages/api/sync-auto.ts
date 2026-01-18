import type { APIRoute } from 'astro';
import { syncWithImageBed } from '../../lib/sync-helper';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime as any;
    const DB = runtime?.env?.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not initialized' }), { status: 500 });
    }

    const result = await syncWithImageBed(DB);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Auto sync error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};
