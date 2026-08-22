/**
 * 找咚 (Dongdoku) 端到端回归脚本。
 *
 * 依赖 playwright，但没有加进 package.json（项目目前没有测试框架）。
 * 跑法：
 *   1. npm run dev                                       # 记下端口，默认 4321，被占用会顺延
 *   2. npm i --no-save playwright                         # 只需一次，不写入 package.json
 *      npx playwright install chromium
 *   3. BASE=http://localhost:4321 node scripts/dongdoku_e2e.cjs
 *
 * 也可以把 playwright 装在别处，用 NODE_PATH 指过来：
 *   NODE_PATH=/path/to/node_modules BASE=... node scripts/dongdoku_e2e.cjs
 *
 * 覆盖：提示链推进、免伤保护只生效一次、跳关不污染通关纪录、
 *      教学关后顶栏更新、英文本地化、弹窗 a11y 与键盘落子、
 *      断点续玩、教学 6 步流程、重来清盘。
 */
const { chromium } = require('playwright');

const BASE = process.env.BASE || 'http://localhost:4323';
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function freshPage(browser, url, storage = {}) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((s) => {
    // 跳过首次欢迎弹窗
    localStorage.setItem('dongdoku_has_seen_guide_v2', 'true');
    localStorage.setItem('dongdoku_tutorial_completed', 'true');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, storage);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('   [pageerror]', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('.grid-cell');
  return { ctx, page };
}

async function openLevel(page, lid) {
  await page.click('#btn-open-levels');
  await page.waitForSelector('#modal-levels .level-card');
  const packIdx = Math.floor((lid - 1) / 50);
  const tabs = await page.$$('.pack-tab-btn');
  await tabs[packIdx].click();
  await page.waitForTimeout(150);
  await page.click(`#levels-grid .level-card:has(.lvl-num:text-is("${lid}"))`);
  await page.waitForTimeout(500);
}

// ── 1. 提示链能一路走到底（核心回归：mark 提示不再卡死）────────────────
async function testHintChainAdvances(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);
  await openLevel(page, 51);

  const seenTexts = [];
  let stuckCount = 0;
  let diedEarly = false;

  for (let i = 0; i < 120; i++) {
    await page.click('#btn-hint');
    await page.waitForSelector('#toast-hint', { state: 'visible' });
    await page.waitForTimeout(150);

    const txt = await page.textContent('#toast-hint-text');
    if (seenTexts.length && txt === seenTexts[seenTexts.length - 1]) stuckCount++;
    else stuckCount = 0;
    seenTexts.push(txt);
    if (stuckCount >= 3) break; // 同一条提示连给 4 次 => 卡死

    // 先把光圈位置读成坐标再动手：每次落子/打叉都会重绘那一格并清掉光圈节点，
    // 拿着 ElementHandle 逐个点在慢网络下会点到已脱离文档的元素上。
    const targets = await page.$$eval('.hint-beacon', (els) =>
      els.map((el) => {
        const cell = el.parentElement;
        return {
          row: cell.dataset.row,
          col: cell.dataset.col,
          exclude: (el.querySelector('.hint-beacon-label')?.textContent || '').includes('排除'),
        };
      }));
    if (targets.length === 0) break;

    for (const t of targets) {
      const sel = `.grid-cell[data-row="${t.row}"][data-col="${t.col}"]`;
      if (t.exclude) {
        await page.click(sel);
        await page.waitForTimeout(480); // 躲开 420ms 双击判定窗口
      } else {
        await page.dblclick(sel);
        await page.waitForTimeout(200);
      }
    }

    if (await page.$eval('#modal-gameover', (el) => el.style.display === 'flex').catch(() => false)) {
      diedEarly = true;
      break;
    }
    if (await page.$eval('#modal-win', (el) => el.style.display === 'flex').catch(() => false)) break;
  }

  const uniqueHints = new Set(seenTexts).size;
  await page.waitForTimeout(1500); // 胜利结算有 1100ms 延迟
  const winVisible = await page.$eval('#modal-win', (el) => el.style.display === 'flex').catch(() => false);
  const placed = await page.textContent('#placed-count');

  check('提示链会前进而不是卡在同一条', uniqueHints >= 5,
    `${uniqueHints} 条不同提示 / 共点 ${seenTexts.length} 次`);
  check('跟着提示走能通关第 51 关', winVisible,
    `已落子 ${placed}/8，胜利弹窗=${winVisible}${diedEarly ? '，中途触发了失败结算' : ''}`);
  if (winVisible) {
    const stars = await page.textContent('#win-rating');
    check('通关弹窗显示星级', /[★☆]{3}/.test(stars), `rating="${stars}"`);
  }
  await ctx.close();
}

// ── 2. 前 3 关只免伤一次，之后照常扣命并会失败 ─────────────────────────
async function testShieldOnlyOnce(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);
  await openLevel(page, 1);

  const size = await page.$$eval('.grid-cell', (els) => Math.sqrt(els.length));
  const solution = await page.evaluate(async () => {
    const r = await fetch('/data/dongdoku/pack_0.json');
    const d = await r.json();
    return d['1'].solution.map((s) => `${s.row},${s.col}`);
  });

  const wrongCells = [];
  for (let r = 0; r < size && wrongCells.length < 4; r++) {
    for (let c = 0; c < size && wrongCells.length < 4; c++) {
      if (!solution.includes(`${r},${c}`)) wrongCells.push([r, c]);
    }
  }

  const livesLog = [];
  for (const [r, c] of wrongCells) {
    await page.dblclick(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
    await page.waitForTimeout(220);
    livesLog.push(await page.textContent('#lives-display'));
  }

  const hearts = (s) => (s.match(/❤️/g) || []).length;
  check('第 1 关首次失误免伤（仍为 3 心）', hearts(livesLog[0]) === 3, `第1次错后 = ${livesLog[0]}`);
  check('第 1 关第 2 次失误开始正常扣命', hearts(livesLog[1]) === 2, `第2次错后 = ${livesLog[1]}`);
  check('前 3 关不再是无限命（心数递减）',
    hearts(livesLog[1]) > hearts(livesLog[2]) && hearts(livesLog[3]) === 0,
    livesLog.join(' → '));

  const gameoverVisible = await page.$eval('#modal-gameover', (el) => el.style.display === 'flex');
  check('生命归零后弹出失败结算', gameoverVisible);

  // ── 5. 刷新页面不能白捡一条命 ──
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.grid-cell');
  await page.waitForTimeout(600);
  const livesAfterReload = await page.textContent('#lives-display');
  const gameoverAfterReload = await page.$eval('#modal-gameover', (el) => el.style.display === 'flex');
  check('刷新后不会白捡命（仍是 0 心）', hearts(livesAfterReload) === 0, `= ${livesAfterReload}`);
  check('刷新后失败结算依然摆出来', gameoverAfterReload);

  await ctx.close();
}

// ── 3. 跳关不再污染「最高通关纪录」──────────────────────────────────
async function testProgressNotPolluted(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);

  await openLevel(page, 1000);
  const title = await page.textContent('#level-title-container');
  check('可以自由跳到第 1000 关', /1000/.test(title), `顶栏 = "${title.trim()}"`);

  await page.click('#btn-open-levels');
  await page.waitForSelector('#modal-levels .level-card');
  const best = await page.textContent('#levels-unlocked-count');
  const completedCount = await page.$$eval('#levels-grid .level-card.completed', (e) => e.length);
  check('跳关不抬高最高通关纪录', best.trim() === '0', `纪录 = ${best.trim()}`);
  check('跳关不会把整页标成已通关', completedCount === 0, `本页 completed 卡片 = ${completedCount}`);

  await ctx.close();
}

// ── 4. 玩过教学关后，顶栏关卡号不再卡在「教学关」───────────────────────
async function testTitleAfterTutorial(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);

  await page.click('#btn-open-tutorial');
  await page.waitForTimeout(500);
  const tutTitle = await page.textContent('#level-title-container');
  check('进入教学关顶栏显示教学关', /教学关/.test(tutTitle), `= "${tutTitle.trim()}"`);

  await openLevel(page, 50);
  const lvlTitle = await page.textContent('#level-title-container');
  check('教学关之后切关，顶栏跟着更新', /50/.test(lvlTitle) && !/教学关/.test(lvlTitle), `= "${lvlTitle.trim()}"`);

  await ctx.close();
}

// ── 6. 英文版没有中文残留 ──────────────────────────────────────────
async function testEnglishLocale(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/en/dongdoku`);

  const hasCJK = (s) => /[一-鿿]/.test(s || '');

  const rulesText = await page.$$eval('#rules-cards-box', (els) => els.map((e) => e.textContent).join(' '))
    .catch(() => '');
  check('英文版三大规则卡片是英文', !hasCJK(rulesText), rulesText.replace(/\s+/g, ' ').trim().slice(0, 90));

  await openLevel(page, 51);
  await page.click('#btn-hint');
  await page.waitForTimeout(200);
  const hintText = await page.textContent('#toast-hint-text');
  check('英文版提示文案是英文', !hasCJK(hintText), `"${hintText}"`);

  const beaconLabel = await page.$eval('.hint-beacon-label', (el) => el.textContent).catch(() => '');
  check('英文版光圈标签是英文', beaconLabel !== '' && !hasCJK(beaconLabel), `"${beaconLabel}"`);

  const cellAria = await page.$eval('.grid-cell', (el) => el.getAttribute('aria-label'));
  check('英文版格子 aria-label 是英文', !hasCJK(cellAria), `"${cellAria}"`);

  await ctx.close();
}

// ── 7. a11y：弹窗语义 + 键盘落子 ────────────────────────────────────
async function testA11y(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);

  // 只看本组件的弹窗；BaseLayout 里 #modalBackdrop 只是遮罩层，不是 dialog
  const dialogs = await page.$$eval('.modal-backdrop[id^="modal-"]', (els) =>
    els.map((e) => ({ id: e.id, role: e.getAttribute('role'), modal: e.getAttribute('aria-modal') })));
  const allTagged = dialogs.length === 5 && dialogs.every((d) => d.role === 'dialog' && d.modal === 'true');
  check('所有弹窗有 dialog / aria-modal 语义', allTagged, `${dialogs.length} 个弹窗`);

  // Esc 关闭选关弹窗
  await page.click('#btn-open-levels');
  await page.waitForSelector('#modal-levels .level-card');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.$eval('#modal-levels', (el) => el.style.display === 'none');
  check('Esc 能关闭选关弹窗', closed);

  // Shift+Enter 键盘落子
  await openLevel(page, 1);
  const sol = await page.evaluate(async () => {
    const r = await fetch('/data/dongdoku/pack_0.json');
    const d = await r.json();
    return d['1'].solution[0];
  });
  await page.focus(`.grid-cell[data-row="${sol.row}"][data-col="${sol.col}"]`);
  await page.keyboard.press('Shift+Enter');
  await page.waitForTimeout(300);
  const state = await page.getAttribute(`.grid-cell[data-row="${sol.row}"][data-col="${sol.col}"]`, 'data-rendered-state');
  check('Shift+Enter 可以键盘落子', state === '2', `data-rendered-state=${state}`);

  await ctx.close();
}

// ── 8. 断点续玩：盘面标记能跨刷新 / 跨切关保留 ──────────────────────
async function testBoardResume(browser) {
  const { ctx, page } = await freshPage(browser, `${BASE}/dongdoku`);
  await openLevel(page, 20);

  const marks = [[0, 0], [0, 1], [1, 0]];
  for (const [r, c] of marks) {
    await page.click(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
    await page.waitForTimeout(500); // 躲开 420ms 双击判定窗口
  }
  const before = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  check('打叉标记生效', before === 3, `${before} 个 ✖`);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.grid-cell');
  await page.waitForTimeout(700);
  const afterReload = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  const lvl = await page.textContent('#level-title-container');
  check('刷新后盘面标记还在（断点续玩）', afterReload === 3, `${afterReload} 个 ✖，顶栏 = "${lvl.trim()}"`);

  await openLevel(page, 21);
  const onOther = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  check('切到别的关是干净盘面', onOther === 0, `${onOther} 个 ✖`);

  await openLevel(page, 20);
  const backAgain = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  check('切回原关标记还原', backAgain === 3, `${backAgain} 个 ✖`);

  await ctx.close();
}

// ── 9. 教学关 6 步能走完 + 重来能清盘 ──────────────────────────────
async function testTutorialAndRestart(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('   [pageerror]', e.message));
  await page.goto(`${BASE}/dongdoku`, { waitUntil: 'networkidle' });

  // 首次访问应自动弹欢迎引导
  await page.waitForSelector('#modal-welcome', { state: 'visible', timeout: 5000 });
  check('首次访问自动弹出新手引导', true);

  await page.click('#btn-welcome-tutorial');
  await page.waitForTimeout(600);

  const steps = [];
  for (let i = 0; i < 20; i++) {
    const counter = await page.textContent('#tutorial-step-counter').catch(() => '');
    if (counter) steps.push(counter.trim());

    const done = await page.$eval('#modal-tutorial-win', (el) => el.style.display === 'flex').catch(() => false);
    if (done) break;

    // 优先用"一键排除"按钮推进 mark 步骤，否则按光圈提示双击
    const autoVisible = await page.$eval('#tutorial-actions-row', (el) => el.style.display === 'flex').catch(() => false);
    if (autoVisible) {
      await page.click('#btn-auto-cross');
      await page.waitForTimeout(500);
      continue;
    }
    const beacon = await page.$('.tutorial-beacon');
    if (!beacon) break;
    const cell = (await beacon.evaluateHandle((el) => el.parentElement)).asElement();
    const box = await cell.boundingBox();
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(600);
  }

  await page.waitForTimeout(1400);
  const tutWin = await page.$eval('#modal-tutorial-win', (el) => el.style.display === 'flex').catch(() => false);
  check('教学关能一路走到毕业弹窗', tutWin, `走过步骤: ${[...new Set(steps)].join(', ')}`);

  if (tutWin) {
    await page.click('#btn-tutorial-start-game');
    await page.waitForTimeout(700);
    const t = await page.textContent('#level-title-container');
    check('教学毕业后进入第 1 关', /1/.test(t) && !/教学关/.test(t), `顶栏 = "${t.trim()}"`);
  }

  // 重来清盘
  await page.click('.grid-cell[data-row="0"][data-col="0"]');
  await page.waitForTimeout(500);
  const beforeRestart = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  await page.click('#btn-restart');
  await page.waitForTimeout(400);
  const afterRestart = await page.$$eval('.grid-cell[data-rendered-state="1"]', (e) => e.length);
  const livesAfter = await page.textContent('#lives-display');
  check('重来会清空盘面并回满血', beforeRestart > 0 && afterRestart === 0 && (livesAfter.match(/❤️/g) || []).length === 3,
    `${beforeRestart} → ${afterRestart} 个 ✖，生命 = ${livesAfter}`);

  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    await testHintChainAdvances(browser);
    await testShieldOnlyOnce(browser);
    await testProgressNotPolluted(browser);
    await testTitleAfterTutorial(browser);
    await testEnglishLocale(browser);
    await testA11y(browser);
    await testBoardResume(browser);
    await testTutorialAndRestart(browser);
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log('FAILED:\n' + failed.map((f) => ' - ' + f.name + (f.detail ? ` (${f.detail})` : '')).join('\n'));
    process.exit(1);
  }
})();
