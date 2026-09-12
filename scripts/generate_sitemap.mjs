import fs from 'fs';
import path from 'path';

const baseUrl = 'https://fzd-fans.com';
const today = new Date().toISOString().split('T')[0];

const staticPagesZh = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'weekly' },
  { path: '/news', priority: '0.9', changefreq: 'daily' },
  { path: '/endorsements', priority: '0.8', changefreq: 'weekly' },
  { path: '/fzd-gallery', priority: '0.8', changefreq: 'weekly' },
  { path: '/games', priority: '0.7', changefreq: 'monthly' },
  { path: '/quiz', priority: '0.7', changefreq: 'monthly' },
  { path: '/changelog', priority: '0.6', changefreq: 'weekly' },
  { path: '/messages', priority: '0.7', changefreq: 'daily' },
  { path: '/arena', priority: '0.8', changefreq: 'weekly' },
  { path: '/stars', priority: '0.8', changefreq: 'weekly' },
  { path: '/stars/porsche-letters', priority: '0.7', changefreq: 'monthly' },
  { path: '/quotes', priority: '0.8', changefreq: 'weekly' },
  { path: '/tributes', priority: '0.8', changefreq: 'weekly' },
  { path: '/warrior', priority: '0.8', changefreq: 'weekly' },
  { path: '/fzd101', priority: '0.8', changefreq: 'weekly' },
  { path: '/links', priority: '0.7', changefreq: 'monthly' },
  { path: '/friends', priority: '0.7', changefreq: 'monthly' },
  { path: '/matches', priority: '0.8', changefreq: 'weekly' },
  { path: '/ugc', priority: '0.7', changefreq: 'weekly' },
  { path: '/ugc/guidelines', priority: '0.5', changefreq: 'monthly' },
  { path: '/breakit', priority: '0.6', changefreq: 'monthly' },
  { path: '/dongdoku', priority: '0.6', changefreq: 'monthly' },
  { path: '/pingpong-defense.html', priority: '0.6', changefreq: 'monthly' },
  { path: '/match3.html', priority: '0.6', changefreq: 'monthly' },
  { path: '/snake.html', priority: '0.6', changefreq: 'monthly' }
];

const staticPagesEn = [
  { path: '/en', priority: '0.9', changefreq: 'daily' },
  { path: '/en/about', priority: '0.8', changefreq: 'weekly' },
  { path: '/en/fzd-gallery', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/games', priority: '0.7', changefreq: 'monthly' },
  { path: '/en/changelog', priority: '0.6', changefreq: 'weekly' },
  { path: '/en/messages', priority: '0.6', changefreq: 'daily' },
  { path: '/en/arena', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/stars', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/quotes', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/tributes', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/warrior', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/fzd101', priority: '0.7', changefreq: 'weekly' },
  { path: '/en/links', priority: '0.6', changefreq: 'monthly' },
  { path: '/en/ugc', priority: '0.6', changefreq: 'weekly' },
  { path: '/en/ugc/guidelines', priority: '0.5', changefreq: 'monthly' },
  { path: '/en/breakit', priority: '0.5', changefreq: 'monthly' },
  { path: '/en/dongdoku', priority: '0.5', changefreq: 'monthly' }
];

const urlMap = new Map();

for (const p of [...staticPagesZh, ...staticPagesEn]) {
  urlMap.set(`${baseUrl}${p.path}`, {
    loc: `${baseUrl}${p.path}`,
    lastmod: today,
    changefreq: p.changefreq,
    priority: p.priority
  });
}

const collections = ['arena', 'friends', 'fzd101', 'links', 'quotes', 'stars', 'tributes', 'ugc', 'warrior'];

for (const col of collections) {
  const colDir = path.join('src/content', col);
  if (!fs.existsSync(colDir)) continue;

  function scan(dir) {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        scan(full);
      } else if (f.endsWith('.md')) {
        const stat = fs.statSync(full);
        const fileMod = stat.mtime.toISOString().split('T')[0];
        const rel = path.relative(colDir, full).replace(/\\/g, '/').replace(/\.md$/, '');
        let url = '';
        if (rel.startsWith('zh/')) {
          url = `${baseUrl}/${col}/${rel.replace(/^zh\//, '')}`;
        } else if (rel.startsWith('en/')) {
          url = `${baseUrl}/en/${col}/${rel.replace(/^en\//, '')}`;
        } else if (!rel.includes('/')) {
          url = `${baseUrl}/${col}/${rel}`;
        }
        if (url) {
          urlMap.set(url, {
            loc: url,
            lastmod: fileMod || today,
            changefreq: 'weekly',
            priority: '0.7'
          });
        }
      }
    }
  }
  scan(colDir);
}

// 1. Generate sitemap.xml
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urlMap.values())
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

fs.writeFileSync('public/sitemap.xml', sitemapXml, 'utf8');
console.log(`Generated public/sitemap.xml with ${urlMap.size} URLs`);

// 2. Generate sitemap-index.xml
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

fs.writeFileSync('public/sitemap-index.xml', sitemapIndexXml, 'utf8');
console.log(`Generated public/sitemap-index.xml`);
