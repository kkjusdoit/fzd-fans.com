import type { APIRoute } from 'astro';

export const prerender = false;

// 净化文本，防止 XSS 与恶意脚本注入
function sanitize(str: unknown, maxLen = 2000): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, maxLen);
}

// 检查是否需要默认人工审核
function isReviewRequired(locals: any): boolean {
  const runtime = locals?.runtime;
  const rawValue = runtime?.env?.MESSAGE_REVIEW_REQUIRED ?? import.meta.env.MESSAGE_REVIEW_REQUIRED;
  return typeof rawValue === 'string' && rawValue.toLowerCase() === 'true';
}

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const DB = runtime?.env?.DB;

  if (!DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database not initialized' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 50);
    const offset = (page - 1) * limit;

    let categoryFilter = '';
    const bindings: any[] = [];

    if (category && category !== 'all') {
      categoryFilter = ' AND category = ?';
      bindings.push(category);
    }

    // 统计总数（仅统计已通过审核 reviewed = 1 的留言）
    const countSql = `SELECT COUNT(*) as total FROM messages WHERE reviewed = 1${categoryFilter}`;
    const countStmt = DB.prepare(countSql);
    const { total } = (bindings.length > 0 ? await countStmt.bind(...bindings).first() : await countStmt.first()) || { total: 0 };

    // 分页查询留言
    const listSql = `SELECT id, category, nickname, avatar, title, content, image_url, likes, created_at 
                     FROM messages 
                     WHERE reviewed = 1${categoryFilter} 
                     ORDER BY created_at DESC 
                     LIMIT ? OFFSET ?`;
    const listBindings = [...bindings, limit, offset];
    const { results } = await DB.prepare(listSql).bind(...listBindings).all();

    return new Response(JSON.stringify({
      success: true,
      data: results || [],
      pagination: {
        total: Number(total),
        page,
        limit,
        has_more: offset + (results?.length || 0) < Number(total)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=10'
      }
    });

  } catch (err: any) {
    console.error('Messages GET error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

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

    const rawContent = String(body.content || '').trim();
    if (!rawContent || rawContent.length < 2) {
      return new Response(JSON.stringify({ success: false, error: '留言内容太短，至少需要2个字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rawContent.length > 2000) {
      return new Response(JSON.stringify({ success: false, error: '留言内容过长，不能超过2000字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let nickname = sanitize(body.nickname, 20);
    if (!nickname) nickname = '樊星球迷';

    const avatar = sanitize(body.avatar || '🏓', 10);
    const category = sanitize(body.category || 'message', 20);
    const title = body.title ? sanitize(body.title, 80) : null;
    const contact = body.contact ? sanitize(body.contact, 100) : null; // 仅存数据库供必要时联络
    const imageUrl = body.image_url ? String(body.image_url).trim().slice(0, 500) : null;
    const content = sanitize(rawContent, 2000);

    const clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const now = Date.now();

    // 防刷频次限制：同一 IP 60 秒内最多提交 2 条留言
    const oneMinuteAgo = now - 60 * 1000;
    const { count: recentCount } = await DB.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE ip = ? AND created_at > ?'
    ).bind(clientIP, oneMinuteAgo).first() || { count: 0 };

    if (Number(recentCount) >= 2) {
      return new Response(JSON.stringify({ success: false, error: '发表过于频繁，请稍候再试' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reviewRequired = isReviewRequired(locals);
    const reviewedStatus = reviewRequired ? 0 : 1;

    const res = await DB.prepare(
      `INSERT INTO messages (category, nickname, avatar, title, content, contact, image_url, likes, reviewed, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).bind(
      category,
      nickname,
      avatar,
      title,
      content,
      contact,
      imageUrl,
      reviewedStatus,
      clientIP,
      now
    ).run();

    const newId = res.meta?.last_row_id;

    return new Response(JSON.stringify({
      success: true,
      message: reviewRequired ? '投稿已提交，将在审核后展示！' : '留言发表成功！',
      data: {
        id: newId,
        reviewed: reviewedStatus
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Messages POST error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
