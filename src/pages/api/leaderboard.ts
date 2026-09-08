import type { APIRoute } from 'astro';

export const prerender = false;

// 支持的游戏列表白名单
const ALLOWED_GAMES = new Set(['match3', 'snake', 'quiz', 'breakit', 'dongdoku']);

// 基础文本防注入净化
function sanitizeText(str: unknown, maxLen = 20): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // 过滤基础 HTML 标签
    .trim()
    .slice(0, maxLen);
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
    const gameId = url.searchParams.get('game') || 'match3';
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
    const period = url.searchParams.get('period') || 'all'; // 'all', 'today', 'week'

    let timeFilterSql = '';
    const now = Date.now();
    if (period === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      timeFilterSql = ` AND created_at >= ${todayStart}`;
    } else if (period === 'week') {
      const weekStart = now - 7 * 24 * 60 * 60 * 1000;
      timeFilterSql = ` AND created_at >= ${weekStart}`;
    }

    // 查询总参与人数
    const { total } = await DB.prepare(
      `SELECT COUNT(*) as total FROM game_leaderboards WHERE game_id = ?${timeFilterSql}`
    ).bind(gameId).first() || { total: 0 };

    // 查询排行榜前 N 名（按分数降序，相同分数按先到先得升序）
    const { results } = await DB.prepare(
      `SELECT id, player_name, score, score_display, extra_info, created_at
       FROM game_leaderboards
       WHERE game_id = ?${timeFilterSql}
       ORDER BY score DESC, created_at ASC
       LIMIT ?`
    ).bind(gameId, limit).all();

    // 格式化输出，带上名次
    const formatted = (results || []).map((row: any, idx: number) => ({
      rank: idx + 1,
      id: row.id,
      player_name: row.player_name || '匿名樊星',
      score: row.score,
      score_display: row.score_display || `${row.score} 分`,
      extra_info: row.extra_info ? safeJsonParse(row.extra_info) : null,
      created_at: row.created_at
    }));

    return new Response(JSON.stringify({
      success: true,
      game_id: gameId,
      period,
      total_players: total,
      leaderboard: formatted
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=5, s-maxage=10' // 边缘轻量缓存
      }
    });

  } catch (err: any) {
    console.error('Leaderboard GET error:', err);
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
    const gameId = String(body.game_id || '').trim();
    let playerName = sanitizeText(body.player_name, 16);
    if (!playerName) playerName = '匿名樊星';

    const rawScore = Number(body.score);
    if (isNaN(rawScore) || rawScore < 0 || rawScore > 100000000) {
      return new Response(JSON.stringify({ success: false, error: '无效的分数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const score = Math.floor(rawScore);
    const scoreDisplay = sanitizeText(body.score_display || `${score} 分`, 30);
    const extraInfo = typeof body.extra_info === 'object' ? JSON.stringify(body.extra_info) : null;
    const clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const now = Date.now();

    // 基础防刷限制：同一 IP 针对同一游戏 5 秒内最多提交 1 次
    const recent = await DB.prepare(
      'SELECT created_at FROM game_leaderboards WHERE game_id = ? AND ip = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(gameId, clientIP).first();

    if (recent && now - Number(recent.created_at) < 5000) {
      return new Response(JSON.stringify({ success: false, error: '提交太频繁，请稍后再试' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 写入 D1
    const res = await DB.prepare(
      `INSERT INTO game_leaderboards (game_id, player_name, score, score_display, extra_info, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(gameId, playerName, score, scoreDisplay, extraInfo, clientIP, now).run();

    // 计算当前上榜名次
    const { higherCount } = await DB.prepare(
      'SELECT COUNT(*) as higherCount FROM game_leaderboards WHERE game_id = ? AND score > ?'
    ).bind(gameId, score).first() || { higherCount: 0 };

    const rank = Number(higherCount) + 1;

    return new Response(JSON.stringify({
      success: true,
      id: res.meta?.last_row_id,
      rank,
      message: `恭喜！你的成绩已登榜，排名第 ${rank} 名！`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Leaderboard POST error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
