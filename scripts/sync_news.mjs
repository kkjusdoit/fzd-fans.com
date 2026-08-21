import fs from 'node:fs/promises';
import path from 'node:path';
import { NEWS_CATEGORIES } from '../src/data/newsCategories.mjs';

// 读取网站快讯数据，编译进小程序 data/news.js
// 规则：过滤 draft:true；webOnly:true 的条目只上网站、不进小程序（复用避审思路）
const NEWS_JSON = path.join(process.cwd(), 'src/data/news.json');
const MINI_APP_DATA_DIR = '/Users/linkunkun/WeChatProjects/miniapp-1/miniprogram/data';
const OUTPUT_FILE = path.join(MINI_APP_DATA_DIR, 'news.js');
const SITE_ORIGIN = 'https://fzd-fans.com';

async function sync() {
  const raw = await fs.readFile(NEWS_JSON, 'utf-8');
  const all = JSON.parse(raw);

  const items = all
    .filter((n) => !n.draft && !n.webOnly)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((n) => {
      const meta = NEWS_CATEGORIES[n.category] || NEWS_CATEGORIES.other;
      // 图片：完整 http url（如照片墙图床）直接用；本地相对路径则加站点前缀
      const image = n.image
        ? (n.image.startsWith('http') ? n.image : `${SITE_ORIGIN}/${n.image.replace(/^\//, '')}`)
        : '';
      return {
        date: n.date,
        category: n.category,
        categoryLabel: meta.label,
        categoryIcon: meta.icon,
        categoryColor: meta.color,
        title: n.title,
        summary: n.summary || '',
        image,
        source: n.source || '',
        highlight: !!n.highlight
      };
    });

  const skipped = all.length - items.length;
  const targetDirs = [
    path.join(process.cwd(), 'wechat-miniprogram/miniprogram/data'),
    MINI_APP_DATA_DIR
  ];

  // 顺带导出分类元信息，供小程序筛选器使用
  const cats = Object.entries(NEWS_CATEGORIES).map(([key, m]) => ({ key, ...m }));

  const out =
    `module.exports = {\n` +
    `  news: ${JSON.stringify(items, null, 2)},\n` +
    `  categories: ${JSON.stringify(cats, null, 2)}\n` +
    `};\n`;

  for (const dir of targetDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const targetFile = path.join(dir, 'news.js');
      await fs.writeFile(targetFile, out, 'utf-8');
      console.log(`快讯同步完成：写入 ${items.length} 条 → ${targetFile}`);
    } catch (e) {
      console.warn(`写入目录 ${dir} 跳过/失败:`, e.message);
    }
  }

  if (skipped > 0) console.log(`（跳过 ${skipped} 条：draft 或 webOnly）`);
}

sync().catch((e) => {
  console.error('快讯同步失败：', e);
  process.exit(1);
});
