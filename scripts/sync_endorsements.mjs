import fs from 'node:fs/promises';
import path from 'node:path';
import { ENDORSEMENT_TYPES, ENDORSEMENT_STATUS } from '../src/data/endorsementsConfig.mjs';

// 编译代言/合作数据进小程序 data/endorsements.js
const SRC = path.join(process.cwd(), 'src/data/endorsements.json');
const MINI_APP_DATA_DIR = '/Users/linkunkun/WeChatProjects/miniapp-1/miniprogram/data';
const OUTPUT_FILE = path.join(MINI_APP_DATA_DIR, 'endorsements.js');
const SITE_ORIGIN = 'https://fzd-fans.com';

function parseTime(s) {
  const m = String(s).match(/(\d{4})[-年]?(\d{1,2})?/);
  if (!m) return 0;
  return new Date(Number(m[1]), m[2] ? Number(m[2]) - 1 : 0).getTime();
}

function initial(brand) {
  const zh = brand.match(/[一-龥]/);
  return zh ? zh[0] : (brand.trim()[0] || '?').toUpperCase();
}

async function sync() {
  const all = JSON.parse(await fs.readFile(SRC, 'utf-8'));

  const items = [...all]
    .sort((a, b) => parseTime(b.signDate) - parseTime(a.signDate))
    .map((i) => {
      const tm = ENDORSEMENT_TYPES[i.type] || ENDORSEMENT_TYPES.commercial;
      const sm = ENDORSEMENT_STATUS[i.status] || ENDORSEMENT_STATUS.active;
      const logo = i.logo ? `${SITE_ORIGIN}/${i.logo.replace(/^\//, '')}` : '';
      return {
        id: i.id,
        brand: i.brand,
        initial: initial(i.brand),
        signDate: i.signDate,
        role: i.role,
        category: i.category,
        slogan: i.slogan || '',
        notes: i.notes || '',
        status: i.status,
        statusLabel: sm.label,
        statusColor: sm.color,
        type: i.type,
        typeLabel: tm.label,
        typeIcon: tm.icon,
        typeColor: tm.color,
        logo,
        officialUrl: i.officialUrl || ''
      };
    });

  const types = Object.entries(ENDORSEMENT_TYPES).map(([key, m]) => ({
    key, ...m, count: items.filter((i) => i.type === key).length
  })).filter((t) => t.count > 0);

  const stats = {
    total: items.length,
    active: items.filter((i) => i.status === 'active').length,
    categories: new Set(items.map((i) => i.category)).size
  };

  await fs.mkdir(MINI_APP_DATA_DIR, { recursive: true });
  const out =
    `module.exports = {\n` +
    `  endorsements: ${JSON.stringify(items, null, 2)},\n` +
    `  types: ${JSON.stringify(types, null, 2)},\n` +
    `  stats: ${JSON.stringify(stats, null, 2)}\n` +
    `};\n`;
  await fs.writeFile(OUTPUT_FILE, out, 'utf-8');
  console.log(`代言合作同步完成：写入 ${items.length} 条 → ${OUTPUT_FILE}`);
}

sync().catch((e) => { console.error('代言同步失败：', e); process.exit(1); });
