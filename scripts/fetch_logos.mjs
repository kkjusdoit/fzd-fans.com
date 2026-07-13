import fs from 'node:fs/promises';
import path from 'node:path';

// 从公开 favicon 服务抓取品牌 logo，落地到 public/img/endorsements/logos/，
// 并回写 endorsements.json 的 logo 字段。
// 说明：Clearbit Logo API 已关停；这里用 Google favicon 服务(sz=256)，
// 抓到的是品牌网站图标（多为 icon/monogram，非完整字标），够卡片小图用。
// 无把握的品牌（俱乐部/赛事/域名不确定）留空，前端用品牌首字占位降级。

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src/data/endorsements.json');
const OUT_DIR = path.join(ROOT, 'public/img/endorsements/logos');
const REL_PREFIX = 'img/endorsements/logos';

// id → 品牌官网域名（仅列有把握的；留空/不列 = 用首字占位）
const DOMAIN_MAP = {
  butterfly: 'butterfly.co.jp',
  yili: 'yili.com',
  jellycat: 'jellycat.com',
  anta: 'anta.com',
  rimowa: 'rimowa.com',
  heytea: 'heytea.com',
  redmi: 'mi.com',
  mlb: 'mlb.com',
  cadillac: 'cadillac.com',
  armani: 'armani.com',
  'anta-fzd': 'anta.com',
  'anta-fzd-2': 'anta.com',
  avene: 'eau-thermale-avene.com',
  guming: 'guming.com',
  meituan: 'meituan.com',
  heineken: 'heineken.com',
  'pierre-fabre': 'pierre-fabre.com',
  klorane: 'klorane.com',
  clinique: 'clinique.com',
  usmile: 'usmile.com.cn',
  nescafe: 'nestle.com',
  cerave: 'cerave.com'
  // 未列（用首字占位）：saarbrucken 俱乐部、quanyunhui 全运会、yili 伊利、
  // dryu 玉泽、xinxiangyin 心相印、satine 金典、usmile —— 域名不确定或抓不到，避免放错图。
};

const faviconUrl = (domain) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

// Google 对未知域名返回的默认地球图标大小固定，用体积粗略过滤明显失败项
const MIN_BYTES = 300;

async function fetchLogo(domain) {
  const res = await fetch(faviconUrl(domain), { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`过小(${buf.length}B)，疑似默认图标`);
  return buf;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const items = JSON.parse(await fs.readFile(SRC, 'utf-8'));

  let ok = 0, skip = 0, fail = 0;
  for (const item of items) {
    const domain = DOMAIN_MAP[item.id];
    if (!domain) {
      skip++;
      continue;
    }
    process.stdout.write(`${item.brand} (${domain}) … `);
    try {
      const buf = await fetchLogo(domain);
      const file = `${item.id}.png`;
      await fs.writeFile(path.join(OUT_DIR, file), buf);
      item.logo = `${REL_PREFIX}/${file}`;
      ok++;
      console.log(`✓ ${buf.length}B`);
    } catch (e) {
      fail++;
      console.log(`✗ ${e.message}（保留首字占位）`);
    }
  }

  await fs.writeFile(SRC, JSON.stringify(items, null, 2) + '\n', 'utf-8');
  console.log(`\n完成：成功 ${ok}，跳过(无域名) ${skip}，失败 ${fail}`);
  console.log('已回写 endorsements.json 的 logo 字段。下一步：npm run endorsements:sync');
}

main().catch((e) => { console.error(e); process.exit(1); });
