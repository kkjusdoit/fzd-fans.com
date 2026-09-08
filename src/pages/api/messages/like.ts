import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const DB = runtime?.env?.DB;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: '无效的留言ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 递增点赞数
    await DB.prepare('UPDATE messages SET likes = likes + 1 WHERE id = ?').bind(id).run();

    // 获取最新点赞数
    const updated = await DB.prepare('SELECT likes FROM messages WHERE id = ?').bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      likes: updated?.likes ?? 1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Like POST error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
