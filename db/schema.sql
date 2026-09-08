CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip TEXT,
  reviewed INTEGER DEFAULT 0,
  desc TEXT
);

-- 小游戏积分排行榜
CREATE TABLE IF NOT EXISTS game_leaderboards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  score_display TEXT,
  extra_info TEXT,
  ip TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_game_score ON game_leaderboards(game_id, score DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created ON game_leaderboards(game_id, created_at DESC);

-- 球迷投稿与留言板
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT 'message',
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '🏓',
  title TEXT,
  content TEXT NOT NULL,
  contact TEXT,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  reviewed INTEGER DEFAULT 1,
  ip TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_cat_rev_created ON messages(category, reviewed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_rev_created ON messages(reviewed, created_at DESC);

