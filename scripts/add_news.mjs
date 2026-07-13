import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { NEWS_CATEGORIES, NEWS_CATEGORY_KEYS } from '../src/data/newsCategories.mjs';

// ============================================================
// add_news.mjs —— 半自动快讯起草
//
// 用法：
//   1. 把新闻截图（.png/.jpg）丢进 _inbox/ 目录
//   2. node scripts/add_news.mjs
//   3. 脚本逐张喂给 StepFun 视觉模型，起草 {date,category,title,summary,source}
//      → 压缩重命名归档到 public/img/news/
//      → 以 draft:true 追加进 src/data/news.json
//   4. 你打开 news.json 校对，改完把 draft 去掉
//   5. node scripts/sync_news.mjs 同步到小程序
//
// 运行：node --env-file=.env scripts/add_news.mjs   (Node 20+ 原生读 .env)
// 也可手动 export STEPFUN_API_KEY=... 再运行。
// ============================================================

const ROOT = process.cwd();
const INBOX_DIR = path.join(ROOT, '_inbox');
const IMG_DIR = path.join(ROOT, 'public/img/news');
const NEWS_JSON = path.join(ROOT, 'src/data/news.json');
const ARCHIVE_DIR = path.join(INBOX_DIR, '_done'); // 处理完的原图归档到这里

const API_KEY = process.env.STEPFUN_API_KEY;
const BASE_URL = process.env.STEPFUN_BASE_URL || 'https://api.stepfun.com/step_plan/v1';
const MODEL = process.env.STEPFUN_MODEL || 'step-3.7-flash';

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function todayISO() {
  // 避免脚本内依赖时间不确定性问题：直接取系统日期作为兜底
  return new Date().toISOString().slice(0, 10);
}

// ---------- 载入 sharp（可选，用于压缩）----------
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('⚠️  sharp 不可用，图片将原样拷贝（不压缩）。');
}

// ---------- 调 StepFun 视觉模型起草 ----------
async function draftFromImage(base64, mediaType) {
  const catList = NEWS_CATEGORY_KEYS
    .map((k) => `${k}(${NEWS_CATEGORIES[k].label})`)
    .join('、');

  const prompt = `你是樊振东粉丝档案馆的资讯编辑。请仔细阅读这张新闻/公告截图，提取一条"快讯"，用于时间轴展示。

严格只返回一个 JSON 对象（不要 markdown 代码块、不要多余文字），字段如下：
- date: 新闻发生日期，格式 YYYY-MM-DD。若图中能看到明确日期就用它；看不到就返回空字符串 ""，我会用今天的日期兜底。
- category: 从以下枚举里选最贴切的一个 key（只填英文 key）：${catList}
- title: 一句话标题，不超过 20 字，中文。
- summary: 2-3 句客观概述，中文，只陈述截图里能看到的事实，不要编造。
- source: 若图中出现可辨认的来源（如"微博@xxx"、媒体名、网址），填该文本；否则填 ""。

只输出 JSON。`;

  const body = {
    model: MODEL,
    max_tokens: 2000, // 该模型带思维链，需给足；只取 text 块
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt }
        ]
      }
    ]
  };

  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`StepFun API ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  // 该模型返回 content 数组，含 thinking 块 + text 块，只取 text
  const textBlock = (data.content || []).find((c) => c.type === 'text');
  const text = textBlock?.text || '';
  if (!text) {
    throw new Error(`未取到 text 输出（可能 max_tokens 被 thinking 吃光）。原始：${JSON.stringify(data).slice(0, 300)}`);
  }
  return parseDraft(text);
}

function parseDraft(text) {
  // 容错：剥掉可能的 ```json 包裹，抓第一个 {...}
  let s = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`无法从模型输出解析 JSON：${text.slice(0, 200)}`);
  const obj = JSON.parse(s.slice(start, end + 1));

  // 归一化 & 校验
  let category = String(obj.category || '').trim();
  if (!NEWS_CATEGORY_KEYS.includes(category)) category = 'other';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(obj.date || '') ? obj.date : todayISO();

  return {
    date,
    category,
    title: String(obj.title || '').trim() || '（待补充标题）',
    summary: String(obj.summary || '').trim(),
    source: String(obj.source || '').trim()
  };
}

// ---------- 生成安全文件名 ----------
function slugify(title, date, idx) {
  const ascii = title
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  // 中文文件名保留也可以，但用日期+序号更稳
  const safe = ascii && /[\w]/.test(ascii) ? ascii : `news-${idx}`;
  return `${date}-${safe}`;
}

// ---------- 图片压缩/拷贝 ----------
async function processImage(srcPath, outBaseNoExt) {
  const outPath = path.join(IMG_DIR, `${outBaseNoExt}.jpg`);
  if (sharp) {
    await sharp(srcPath)
      .resize({ width: 1080, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(outPath);
  } else {
    // 无 sharp：原样拷贝，保留原扩展名
    const ext = path.extname(srcPath).toLowerCase();
    const raw = path.join(IMG_DIR, `${outBaseNoExt}${ext}`);
    await fs.copyFile(srcPath, raw);
    return `img/news/${outBaseNoExt}${ext}`;
  }
  return `img/news/${outBaseNoExt}.jpg`;
}

async function main() {
  if (!API_KEY) {
    console.error('❌ 未找到 STEPFUN_API_KEY。请用：node --env-file=.env scripts/add_news.mjs');
    process.exit(1);
  }

  await fs.mkdir(INBOX_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const entries = (await fs.readdir(INBOX_DIR, { withFileTypes: true }))
    .filter((e) => e.isFile() && IMG_EXT.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  if (entries.length === 0) {
    console.log(`📭 _inbox/ 里没有待处理图片。把新闻截图放进 ${INBOX_DIR} 再运行。`);
    return;
  }

  console.log(`📥 发现 ${entries.length} 张截图，开始起草…\n`);

  const existing = JSON.parse(await fs.readFile(NEWS_JSON, 'utf-8'));
  const drafts = [];

  for (let i = 0; i < entries.length; i++) {
    const name = entries[i];
    const srcPath = path.join(INBOX_DIR, name);
    const ext = path.extname(name).toLowerCase();
    const mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    process.stdout.write(`[${i + 1}/${entries.length}] ${name} … `);

    try {
      const buf = await fs.readFile(srcPath);
      const base64 = buf.toString('base64');
      const draft = await draftFromImage(base64, mediaType);

      const baseNoExt = slugify(draft.title, draft.date, i + 1);
      const imgRel = await processImage(srcPath, baseNoExt);

      const item = {
        date: draft.date,
        category: draft.category,
        title: draft.title,
        summary: draft.summary,
        image: imgRel,
        source: draft.source,
        webOnly: false,
        draft: true // 起草态，等你校对后手动改 false
      };
      drafts.push(item);

      // 原图归档
      await fs.rename(srcPath, path.join(ARCHIVE_DIR, name));
      console.log(`✓ ${draft.category}｜${draft.title}`);
    } catch (err) {
      console.log(`✗ 失败：${err.message}`);
    }
  }

  if (drafts.length === 0) {
    console.log('\n没有成功起草的条目。');
    return;
  }

  // 合并写回，按日期倒序
  const merged = [...drafts, ...existing].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  await fs.writeFile(NEWS_JSON, JSON.stringify(merged, null, 2) + '\n', 'utf-8');

  console.log(`\n✅ 已追加 ${drafts.length} 条草稿到 src/data/news.json（均标记 draft:true）`);
  console.log('👉 下一步：打开 news.json 校对文字，把满意的条目 draft 改为 false，然后运行：');
  console.log('   node scripts/sync_news.mjs');
}

main().catch((e) => {
  console.error('运行出错：', e);
  process.exit(1);
});
