import type { APIRoute } from 'astro';
import { syncWithImageBed } from '../../lib/sync-helper';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const DB = runtime?.env?.DB;

    if (!DB) {
      return new Response(JSON.stringify({ error: 'Database not initialized' }), { status: 500 });
    }

    // Pass env to helper to use configured credentials
    const result = await syncWithImageBed(DB, runtime.env || {});

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Auto sync error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};
