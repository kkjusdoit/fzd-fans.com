/**
 * 小程序推荐弹窗的分语言行为校验（BaseLayout）。
 *
 * 弹窗内容与二维码都是面向国内微信用户的，所以英文站整块不渲染；
 * 中文站照旧弹出，找咚页面照旧跳过（棋盘要接指针事件）。
 *
 * 依赖 playwright，未写入 package.json。跑法：
 *   1. npm run dev
 *   2. npm i --no-save playwright && npx playwright install chromium
 *   3. BASE=http://localhost:4321 node scripts/promo_modal_locale_check.cjs
 * 也可用 NODE_PATH 指向别处的 playwright，或把 BASE 指向线上做发布后验证。
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:4321';
const EN_PAGES = ['/en/', '/en/about/', '/en/games/', '/en/quotes/'];
const ZH_PAGES = ['/', '/about/', '/games/'];
const GAME_PAGES = ['/dongdoku/', '/en/dongdoku/'];
const CJK_MARKER = '使用微信小程序获得最佳体验';

let fails = 0;
const ck = (name, pass, detail = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!pass) fails++;
};

async function visit(browser, path) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2600); // 弹窗在 1500ms + 20ms 过渡后出现
  const exists = (await page.$('#promoModal')) !== null;
  const visible = exists && (await page.$eval('#promoModal', (el) => getComputedStyle(el).display !== 'none'));
  const cjk = (await page.content()).includes(CJK_MARKER);
  return { ctx, page, exists, visible, cjk, errs };
}

(async () => {
  const browser = await chromium.launch();

  for (const p of EN_PAGES) {
    const r = await visit(browser, p);
    ck(`英文页 ${p} 不渲染推广弹窗`, !r.exists && !r.visible && !r.cjk,
      `DOM 中存在=${r.exists} 可见=${r.visible} 中文残留=${r.cjk}`);
    ck(`英文页 ${p} 无 JS 报错`, r.errs.length === 0, r.errs.join(' | ') || 'clean');
    await r.ctx.close();
  }

  for (const p of ZH_PAGES) {
    const r = await visit(browser, p);
    ck(`中文页 ${p} 仍会弹出`, r.visible, `可见=${r.visible}`);
    if (r.visible) {
      await r.page.click('#modalDismissBtn');
      await r.page.waitForTimeout(600);
      const gone = await r.page.$eval('#promoModal', (el) => getComputedStyle(el).display === 'none');
      const saved = await r.page.evaluate(() => localStorage.getItem('fzd_promo_dismissed_until'));
      ck(`中文页 ${p} 「我知道了」能关闭并记住 3 天`, gone && Number(saved) > Date.now(),
        `已关闭=${gone} 记忆至=${saved ? new Date(Number(saved)).toISOString().slice(0, 10) : 'null'}`);
    }
    ck(`中文页 ${p} 无 JS 报错`, r.errs.length === 0, r.errs.join(' | ') || 'clean');
    await r.ctx.close();
  }

  for (const p of GAME_PAGES) {
    const r = await visit(browser, p);
    ck(`找咚 ${p} 不弹推广弹窗`, !r.visible, `可见=${r.visible}`);
    await r.ctx.close();
  }

  await browser.close();
  console.log(`\n${fails === 0 ? 'all passed' : fails + ' failed'}`);
  process.exit(fails ? 1 : 0);
})();
