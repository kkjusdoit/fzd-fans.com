(() => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gridSize = Number(canvas.dataset.grid || 20);
  const cellSize = Number(canvas.dataset.cell || 20);
  const tickMs = Number(canvas.dataset.tick || 130);
  const dpr = window.devicePixelRatio || 1;
  const boardPx = gridSize * cellSize;

  canvas.style.width = `${boardPx}px`;
  canvas.style.height = `${boardPx}px`;
  canvas.width = boardPx * dpr;
  canvas.height = boardPx * dpr;
  ctx.scale(dpr, dpr);

  const scoreValue = document.getElementById('score-value');
  const statusText = document.getElementById('status-text');
  const restartBtn = document.getElementById('restart-btn');
  const controls = document.getElementById('controls');

  const strings = {
    ready: document.body.dataset.statusReady || 'Press arrow keys to start',
    running: document.body.dataset.statusRunning || 'Running',
    over: document.body.dataset.statusOver || 'Game Over',
    start: document.body.dataset.labelStart || 'Start',
    restart: document.body.dataset.labelRestart || 'Restart'
  };

  const palette = {
    board: '#f8fbff',
    grid: '#e4edf7',
    snake: '#1e88e5',
    snakeHead: '#1565c0',
    food: '#f44336'
  };

  function isOpposite(a, b) {
    return (
      (a === 'up' && b === 'down') ||
      (a === 'down' && b === 'up') ||
      (a === 'left' && b === 'right') ||
      (a === 'right' && b === 'left')
    );
  }

  function createInitialState({ gridSize, initialLength, direction, rng = Math.random }) {
    const mid = Math.floor(gridSize / 2);
    const head = { x: mid + 1, y: mid };
    const snake = [];

    for (let i = 0; i < initialLength; i += 1) {
      const offset = direction === 'right' ? -i : i;
      snake.push({ x: head.x + offset, y: head.y });
    }

    const food = spawnFood(snake, gridSize, rng);

    return {
      gridSize,
      snake,
      direction,
      food,
      score: 0
    };
  }

  function spawnFood(snake, gridSize, rng = Math.random) {
    const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
    const available = gridSize * gridSize - snake.length;

    if (available <= 0) return null;

    let target = Math.floor(rng() * available);

    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        if (!occupied.has(`${x},${y}`)) {
          if (target === 0) return { x, y };
          target -= 1;
        }
      }
    }

    return null;
  }

  function step(state, nextDir, rng = Math.random) {
    const direction = isOpposite(nextDir, state.direction) ? state.direction : nextDir;
    const head = state.snake[0];
    const nextHead = { x: head.x, y: head.y };

    if (direction === 'up') nextHead.y -= 1;
    if (direction === 'down') nextHead.y += 1;
    if (direction === 'left') nextHead.x -= 1;
    if (direction === 'right') nextHead.x += 1;

    const outOfBounds =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= state.gridSize ||
      nextHead.y >= state.gridSize;

    const ate = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
    const bodyToCheck = state.snake.slice(0, state.snake.length - (ate ? 0 : 1));
    const hitSelf = bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);

    if (outOfBounds || hitSelf) {
      return {
        state: { ...state, direction },
        ate: false,
        gameOver: true
      };
    }

    const newSnake = [nextHead, ...state.snake];
    if (!ate) newSnake.pop();

    const food = ate ? spawnFood(newSnake, state.gridSize, rng) : state.food;

    return {
      state: {
        ...state,
        snake: newSnake,
        direction,
        food,
        score: state.score + (ate ? 1 : 0)
      },
      ate,
      gameOver: false
    };
  }

  let state = createInitialState({
    gridSize,
    initialLength: 3,
    direction: 'right'
  });

  let status = 'ready';
  let pendingDir = null;

  function updateScore() {
    if (scoreValue) scoreValue.textContent = String(state.score);
  }

  function setStatus(nextStatus) {
    status = nextStatus;
    if (!statusText) return;

    if (status === 'ready') {
      statusText.textContent = strings.ready;
      if (restartBtn) restartBtn.textContent = strings.start;
    } else if (status === 'running') {
      statusText.textContent = strings.running;
      if (restartBtn) restartBtn.textContent = strings.restart;
    } else {
      statusText.textContent = strings.over;
      if (restartBtn) restartBtn.textContent = strings.restart;
    }
  }

  function ensureRunning() {
    if (status === 'ready') {
      setStatus('running');
    }
  }

  function reset(startImmediately) {
    state = createInitialState({
      gridSize,
      initialLength: 3,
      direction: 'right'
    });
    pendingDir = null;
    updateScore();
    setStatus(startImmediately ? 'running' : 'ready');
    render();
  }

  function handleDirection(dir) {
    if (status === 'gameover') return;
    if (isOpposite(dir, state.direction)) return;
    pendingDir = dir;
    ensureRunning();
  }

  function render() {
    ctx.clearRect(0, 0, boardPx, boardPx);

    ctx.fillStyle = palette.board;
    ctx.fillRect(0, 0, boardPx, boardPx);

    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i += 1) {
      const pos = i * cellSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, boardPx);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(boardPx, pos);
      ctx.stroke();
    }

    if (state.food) {
      ctx.fillStyle = palette.food;
      const foodX = state.food.x * cellSize + cellSize / 2;
      const foodY = state.food.y * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.arc(foodX, foodY, cellSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    state.snake.forEach((seg, index) => {
      ctx.fillStyle = index === 0 ? palette.snakeHead : palette.snake;
      ctx.fillRect(
        seg.x * cellSize + 1,
        seg.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (
      key === 'arrowup' ||
      key === 'arrowdown' ||
      key === 'arrowleft' ||
      key === 'arrowright' ||
      key === 'w' ||
      key === 'a' ||
      key === 's' ||
      key === 'd'
    ) {
      event.preventDefault();
    }

    if (key === 'arrowup' || key === 'w') handleDirection('up');
    if (key === 'arrowdown' || key === 's') handleDirection('down');
    if (key === 'arrowleft' || key === 'a') handleDirection('left');
    if (key === 'arrowright' || key === 'd') handleDirection('right');
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });

  if (restartBtn) {
    restartBtn.addEventListener('click', () => reset(true));
  }

  if (controls) {
    controls.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const dir = btn.getAttribute('data-dir');
        if (dir) handleDirection(dir);
      });
    });
  }

  setStatus('ready');
  updateScore();
  render();

  setInterval(() => {
    if (status !== 'running') return;
    const nextDir = pendingDir || state.direction;
    const result = step(state, nextDir);
    pendingDir = null;
    state = result.state;

    if (result.gameOver) {
      setStatus('gameover');
    }

    updateScore();
    render();
  }, tickMs);

  window.Snake = {
    createInitialState,
    step,
    spawnFood,
    isOpposite
  };
})();
