import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const GAME_FILE = new URL('../src/pages/pingpong-defense.html', import.meta.url);

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.style = {};
    this.className = '';
    this.classList = new FakeClassList();
    this.innerHTML = '';
    this.textContent = '';
    this.clientWidth = 960;
    this.clientHeight = 600;
    this.disabled = false;
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatch(type, extra = {}) {
    const event = { type, preventDefault() {}, ...extra };
    for (const listener of this.listeners.get(type) || []) listener(event);
  }
  appendChild() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 600 }; }
}

function createContext() {
  const elements = new Map();
  const windowListeners = new Map();
  const documentListeners = new Map();
  const mediaListeners = [];
  const rafCallbacks = new Map();
  let rafSeq = 0;
  let now = 1000;

  const canvasContext = new Proxy({
    measureText: text => ({ width: String(text).length * 10 }),
    createRadialGradient: () => ({ addColorStop() {} }),
  }, {
    get(target, key) { return key in target ? target[key] : (() => {}); },
    set(target, key, value) { target[key] = value; return true; },
  });

  function getElement(id) {
    if (!elements.has(id)) {
      const element = new FakeElement(id);
      if (id === 'game') element.getContext = () => canvasContext;
      elements.set(id, element);
    }
    return elements.get(id);
  }

  const portraitMedia = {
    matches: false,
    addEventListener(type, listener) { if (type === 'change') mediaListeners.push(listener); },
    addListener(listener) { mediaListeners.push(listener); },
    dispatch() { for (const listener of mediaListeners) listener({ matches: this.matches }); },
  };

  const document = {
    hidden: false,
    getElementById: getElement,
    createElement: () => new FakeElement(),
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(listener);
    },
    dispatch(type) { for (const listener of documentListeners.get(type) || []) listener({ type }); },
  };

  const window = {
    devicePixelRatio: 1,
    matchMedia: () => portraitMedia,
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(listener);
    },
    dispatch(type) { for (const listener of windowListeners.get(type) || []) listener({ type }); },
  };

  const fixedMath = Object.create(Math);
  fixedMath.random = () => 0.5;
  const sandbox = {
    console,
    Math: fixedMath,
    JSON,
    Set,
    Object,
    Array,
    Date,
    document,
    window,
    performance: { now: () => now },
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame(callback) { const id = ++rafSeq; rafCallbacks.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafCallbacks.delete(id); },
  };
  sandbox.globalThis = sandbox;

  const html = fs.readFileSync(GAME_FILE, 'utf8');
  let script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'game inline script should exist');
  script = script.replace(/\}\)\(\);\s*$/, `
    globalThis.__gameTest = {
      DEFENDERS, ENEMIES, LEVELS, MEDAL_POOL, HOME_X,
      startLevel, update, spawnEnemy, handleTap, triggerLose,
      availableDefenders, cellCenterX, cellCenterY, syncEnvironmentPause,
      get state() { return state; },
      get levelIndex() { return levelIndex; },
      get honor() { return honor; },
      set honor(value) { honor = value; },
      get elapsed() { return elapsed; },
      get enemies() { return enemies; },
      set enemies(value) { enemies = value; },
      get defenders() { return defenders; },
      set defenders(value) { defenders = value; },
      get bullets() { return bullets; },
      set bullets(value) { bullets = value; },
      get hostiles() { return hostiles; },
      get mowers() { return mowers; },
      get selectedCard() { return selectedCard; },
      set selectedCard(value) { selectedCard = value; },
      get cardCooldowns() { return cardCooldowns; },
      get pauseReasons() { return pauseReasons; },
      isolateWorld() {
        level = { name: 'test', waves: [{ at: 1e9, spawns: [] }] };
        waveIdx = 0; elapsed = 0; medalDropT = 1e9; surgeT = 0;
        defenders = []; enemies = []; bullets = []; hostiles = []; medals = []; floats = [];
        selectedCard = null; cardCooldowns = {}; banner = null; killQuoteCd = 0;
      },
    };
  })();`);
  vm.runInNewContext(script, sandbox, { filename: GAME_FILE.pathname });

  return {
    game: sandbox.__gameTest,
    element: getElement,
    portraitMedia,
    document,
    setNow(value) { now = value; },
  };
}

function entityFrom(def, overrides = {}) {
  return { type: 'test', def, row: 0, x: 500, hp: def.hp, maxHp: def.hp,
    speed: 0, slowT: 0, atkT: 0, summonT: 4, healT: 3, phase: 0, ...overrides };
}

test('a projectile-killed boss cannot act or summon in the same frame', () => {
  const { game } = createContext();
  game.startLevel(2);
  game.isolateWorld();
  const wallDef = game.DEFENDERS.wall;
  const wall = { type: 'wall', def: wallDef, row: 0, col: 0, x: game.cellCenterX(0), y: game.cellCenterY(0), hp: wallDef.hp, maxHp: wallDef.hp, fireT: 0 };
  const boss = entityFrom(game.ENEMIES.boss, { type: 'boss', x: wall.x + 15, hp: 1, summonT: 0 });
  game.defenders = [wall];
  game.enemies = [boss];
  game.bullets = [{ x: boss.x - 7, y: wall.y, row: 0, dmg: 10, pierce: false, slow: false, vx: 420, hit: new Set() }];

  game.update(1 / 60);

  assert.equal(game.enemies.length, 0);
  assert.equal(wall.hp, wall.maxHp);
});

test('healing affects living targets but never revives a dead enemy', () => {
  const { game } = createContext();
  game.startLevel(2);
  game.isolateWorld();
  const patron = entityFrom(game.ENEMIES.patron, { type: 'patron', x: 500, healT: 0 });
  const dead = entityFrom(game.ENEMIES.troll, { type: 'troll', x: 510, hp: 0 });
  const wounded = entityFrom(game.ENEMIES.troll, { type: 'troll', x: 520, hp: 20 });
  game.enemies = [patron, dead, wounded];

  game.update(1 / 60);

  assert.ok(!game.enemies.includes(dead));
  assert.equal(wounded.hp, 50);
});

test('one mower clears simultaneous breaches and a full-health boss', async t => {
  await t.test('two enemies in one lane do not cause a false loss', () => {
    const { game } = createContext();
    game.startLevel(0);
    game.isolateWorld();
    game.enemies = [
      entityFrom(game.ENEMIES.follower, { x: game.HOME_X + 5 }),
      entityFrom(game.ENEMIES.follower, { x: game.HOME_X + 5 }),
    ];
    game.update(1 / 60);
    assert.equal(game.state, 'playing');
    assert.equal(game.enemies.length, 0);
    assert.equal(game.mowers[0].used, true);
  });

  await t.test('boss is cleared in one sweep', () => {
    const { game } = createContext();
    game.startLevel(2);
    game.isolateWorld();
    game.enemies = [entityFrom(game.ENEMIES.boss, { type: 'boss', x: game.HOME_X + 5 })];
    game.update(1 / 60);
    assert.equal(game.state, 'playing');
    assert.equal(game.enemies.length, 0);
  });

  await t.test('a later breach after the mower is spent still loses', () => {
    const { game } = createContext();
    game.startLevel(0);
    game.isolateWorld();
    game.mowers[0].used = true;
    game.mowers[0].active = false;
    game.enemies = [entityFrom(game.ENEMIES.follower, { x: game.HOME_X + 5 })];
    game.update(1 / 60);
    assert.equal(game.state, 'lost');
  });
});

test('the second level exposes the referee requested by its tutorial', () => {
  const { game } = createContext();
  game.startLevel(0);
  assert.ok(!game.availableDefenders().includes('referee'));
  game.startLevel(1);
  assert.ok(game.availableDefenders().includes('referee'));
});

test('smash cooldown prevents repeated damage and spending until ready', () => {
  const { game } = createContext();
  game.startLevel(2);
  game.isolateWorld();
  game.honor = 1000;
  const target = entityFrom(game.ENEMIES.follower, { x: 800, hp: 10000, maxHp: 10000 });
  game.enemies = [target];
  const useSmash = () => {
    game.selectedCard = 'smash';
    game.handleTap(game.cellCenterX(4), game.cellCenterY(0));
  };

  useSmash();
  assert.equal(target.hp, 9400);
  assert.equal(game.honor, 825);
  assert.equal(game.cardCooldowns.smash, game.DEFENDERS.smash.cd);

  useSmash();
  assert.equal(target.hp, 9400);
  assert.equal(game.honor, 825);

  game.update(game.DEFENDERS.smash.cd - 0.001);
  useSmash();
  assert.equal(target.hp, 9400);
  game.update(0.002);
  useSmash();
  assert.equal(target.hp, 8800);
  assert.equal(game.honor, 650);
});

test('failure primary action restarts the current level', () => {
  const ctx = createContext();
  ctx.game.startLevel(1);
  ctx.game.triggerLose();
  assert.equal(ctx.element('btn-res-next').textContent, '重新挑战');

  ctx.setNow(2000);
  ctx.element('btn-res-next').dispatch('click');

  assert.equal(ctx.game.state, 'playing');
  assert.equal(ctx.game.levelIndex, 1);
  assert.equal(ctx.game.elapsed, 0);
});

test('manual and environment pauses freeze the world until explicit resume', () => {
  const ctx = createContext();
  ctx.game.startLevel(0);
  ctx.game.isolateWorld();
  const enemy = entityFrom(ctx.game.ENEMIES.follower, { x: 500, speed: 10 });
  ctx.game.enemies = [enemy];

  ctx.setNow(2000);
  ctx.element('pause-btn').dispatch('click');
  assert.equal(ctx.game.state, 'paused');
  const before = { elapsed: ctx.game.elapsed, x: enemy.x };
  ctx.game.update(1);
  assert.deepEqual({ elapsed: ctx.game.elapsed, x: enemy.x }, before);

  ctx.setNow(2500);
  ctx.element('pause-btn').dispatch('click');
  assert.equal(ctx.game.state, 'playing');

  ctx.portraitMedia.matches = true;
  ctx.portraitMedia.dispatch();
  assert.equal(ctx.game.state, 'paused');
  ctx.portraitMedia.matches = false;
  ctx.portraitMedia.dispatch();
  assert.equal(ctx.game.state, 'paused');

  ctx.setNow(3000);
  ctx.element('pause-btn').dispatch('click');
  assert.equal(ctx.game.state, 'playing');

  ctx.document.hidden = true;
  ctx.document.dispatch('visibilitychange');
  assert.equal(ctx.game.state, 'paused');
  ctx.document.hidden = false;
  ctx.document.dispatch('visibilitychange');
  assert.equal(ctx.game.state, 'paused');
});

test('economy and burst values stay within the balanced envelope', () => {
  const { game } = createContext();
  assert.equal(Math.max(...game.MEDAL_POOL.map(medal => medal.v)), 200);
  assert.deepEqual(
    { cost: game.DEFENDERS.smash.cost, damage: game.DEFENDERS.smash.dmg, cooldown: game.DEFENDERS.smash.cd },
    { cost: 175, damage: 600, cooldown: 16 },
  );
});
