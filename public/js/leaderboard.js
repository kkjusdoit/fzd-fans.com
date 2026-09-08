/**
 * 樊振东粉丝站 - 小游戏通用排行榜组件 (Leaderboard Client)
 * 支持独立 HTML 游戏与 Astro 页面直接调用
 */
(function(window) {
  'use strict';

  const GAME_NAMES = {
    match3: '咚咚消消乐',
    snake: '贪吃蛇',
    quiz: '球迷学霸榜',
    breakit: '打爆一切',
    dongdoku: '找咚 (Dongdoku)'
  };

  // 注入排行榜所需样式
  function injectStyles() {
    if (document.getElementById('fzd-leaderboard-styles')) return;
    const style = document.createElement('style');
    style.id = 'fzd-leaderboard-styles';
    style.textContent = `
      .fzd-lb-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(10, 25, 47, 0.75);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .fzd-lb-modal-backdrop.show {
        opacity: 1;
      }
      .fzd-lb-modal {
        background: #ffffff;
        border-radius: 20px;
        width: 100%;
        max-width: 440px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        animation: fzdLbPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
        color: #333;
      }
      @keyframes fzdLbPop {
        from { transform: scale(0.9) translateY(20px); }
        to { transform: scale(1) translateY(0); }
      }
      .fzd-lb-header {
        background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
        color: white;
        padding: 16px 20px;
        position: relative;
        text-align: center;
      }
      .fzd-lb-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .fzd-lb-subtitle {
        font-size: 0.8rem;
        color: #bbdefb;
        margin-top: 4px;
      }
      .fzd-lb-close {
        position: absolute;
        right: 14px;
        top: 14px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .fzd-lb-close:hover {
        background: rgba(255, 255, 255, 0.35);
      }
      .fzd-lb-tabs {
        display: flex;
        background: #f1f5f9;
        padding: 6px 12px;
        gap: 8px;
        border-bottom: 1px solid #e2e8f0;
      }
      .fzd-lb-tab {
        flex: 1;
        padding: 8px 12px;
        border: none;
        background: transparent;
        font-size: 0.9rem;
        color: #64748b;
        font-weight: 600;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .fzd-lb-tab.active {
        background: white;
        color: #1e88e5;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      }
      .fzd-lb-body {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        min-height: 220px;
      }
      .fzd-lb-item {
        display: flex;
        align-items: center;
        padding: 10px 12px;
        border-radius: 12px;
        margin-bottom: 6px;
        background: #f8fafc;
        transition: background 0.15s;
      }
      .fzd-lb-item:hover {
        background: #f1f5f9;
      }
      .fzd-lb-item.top-1 {
        background: linear-gradient(90deg, #fffbeb 0%, #fff 100%);
        border: 1px solid #fef3c7;
      }
      .fzd-lb-item.top-2 {
        background: linear-gradient(90deg, #f8fafc 0%, #fff 100%);
        border: 1px solid #e2e8f0;
      }
      .fzd-lb-item.top-3 {
        background: linear-gradient(90deg, #fff7ed 0%, #fff 100%);
        border: 1px solid #ffedd5;
      }
      .fzd-lb-rank {
        width: 34px;
        font-size: 1.1rem;
        font-weight: 800;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .fzd-lb-rank.gold { color: #f59e0b; }
      .fzd-lb-rank.silver { color: #94a3b8; }
      .fzd-lb-rank.bronze { color: #d97706; }
      .fzd-lb-user {
        flex: 1;
        margin: 0 10px;
        overflow: hidden;
      }
      .fzd-lb-name {
        font-weight: 600;
        font-size: 0.95rem;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .fzd-lb-time {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 2px;
      }
      .fzd-lb-score {
        font-weight: 700;
        font-size: 1.05rem;
        color: #1e88e5;
      }
      .fzd-lb-empty, .fzd-lb-loading {
        text-align: center;
        padding: 40px 16px;
        color: #94a3b8;
        font-size: 0.95rem;
      }
      .fzd-lb-prompt-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 14px;
        padding: 16px;
        margin: 12px 16px;
        text-align: center;
      }
      .fzd-lb-prompt-title {
        font-weight: 700;
        color: #166534;
        font-size: 1rem;
        margin-bottom: 6px;
      }
      .fzd-lb-prompt-score {
        font-size: 1.4rem;
        font-weight: 800;
        color: #15803d;
        margin-bottom: 12px;
      }
      .fzd-lb-input-group {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      .fzd-lb-input {
        flex: 1;
        max-width: 200px;
        padding: 8px 12px;
        border: 1px solid #86efac;
        border-radius: 8px;
        font-size: 0.9rem;
        outline: none;
      }
      .fzd-lb-input:focus {
        border-color: #22c55e;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
      }
      .fzd-lb-btn-submit {
        background: #16a34a;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.2s;
      }
      .fzd-lb-btn-submit:hover {
        background: #15803d;
      }
      .fzd-lb-btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .fzd-lb-trigger-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: rgba(255, 255, 255, 0.9);
        color: #1e88e5;
        border: 1px solid #bbdefb;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
        transition: all 0.2s;
      }
      .fzd-lb-trigger-btn:hover {
        background: #1e88e5;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  // 格式化相对时间
  function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  const Leaderboard = {
    currentPeriod: 'all',
    currentGameId: 'match3',

    /**
     * 打开排行榜弹窗
     * @param {string} gameId - 游戏 ID
     */
    show: function(gameId) {
      injectStyles();
      this.currentGameId = gameId || this.currentGameId;

      let backdrop = document.getElementById('fzd-lb-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'fzd-lb-modal-backdrop';
        backdrop.className = 'fzd-lb-modal-backdrop';
        document.body.appendChild(backdrop);
      }

      const gameTitle = GAME_NAMES[this.currentGameId] || '小游戏';

      backdrop.innerHTML = `
        <div class="fzd-lb-modal" onclick="event.stopPropagation()">
          <div class="fzd-lb-header">
            <button class="fzd-lb-close" id="fzd-lb-close-btn" aria-label="关闭">✕</button>
            <h3 class="fzd-lb-title">🏆 ${gameTitle} 排行榜</h3>
            <div class="fzd-lb-subtitle">与全球樊星一决高下</div>
          </div>
          <div class="fzd-lb-tabs">
            <button class="fzd-lb-tab ${this.currentPeriod === 'all' ? 'active' : ''}" data-period="all">总荣誉榜</button>
            <button class="fzd-lb-tab ${this.currentPeriod === 'today' ? 'active' : ''}" data-period="today">今日榜单</button>
          </div>
          <div id="fzd-lb-list" class="fzd-lb-body">
            <div class="fzd-lb-loading">正在加载最新排名...</div>
          </div>
        </div>
      `;

      // 事件绑定
      setTimeout(() => backdrop.classList.add('show'), 10);
      document.getElementById('fzd-lb-close-btn').onclick = () => this.hide();
      backdrop.onclick = (e) => {
        if (e.target === backdrop) this.hide();
      };

      const tabs = backdrop.querySelectorAll('.fzd-lb-tab');
      tabs.forEach(tab => {
        tab.onclick = () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentPeriod = tab.dataset.period;
          this.loadData();
        };
      });

      this.loadData();
    },

    /**
     * 隐藏排行榜弹窗
     */
    hide: function() {
      const backdrop = document.getElementById('fzd-lb-modal-backdrop');
      if (backdrop) {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.remove(), 250);
      }
    },

    /**
     * 拉取排行榜数据并渲染
     */
    loadData: async function() {
      const listContainer = document.getElementById('fzd-lb-list');
      if (!listContainer) return;

      listContainer.innerHTML = '<div class="fzd-lb-loading">正在拉取排名...</div>';

      try {
        const res = await fetch(`/api/leaderboard?game=${encodeURIComponent(this.currentGameId)}&period=${this.currentPeriod}&limit=20`);
        const json = await res.json();

        if (!json.success || !json.leaderboard || json.leaderboard.length === 0) {
          listContainer.innerHTML = '<div class="fzd-lb-empty">暂无上榜记录，快来抢占第一名吧！</div>';
          return;
        }

        let html = '';
        json.leaderboard.forEach(item => {
          let rankClass = '';
          let rankBadge = item.rank;
          let topClass = '';

          if (item.rank === 1) {
            rankClass = 'gold';
            rankBadge = '🥇';
            topClass = 'top-1';
          } else if (item.rank === 2) {
            rankClass = 'silver';
            rankBadge = '🥈';
            topClass = 'top-2';
          } else if (item.rank === 3) {
            rankClass = 'bronze';
            rankBadge = '🥉';
            topClass = 'top-3';
          }

          html += `
            <div class="fzd-lb-item ${topClass}">
              <div class="fzd-lb-rank ${rankClass}">${rankBadge}</div>
              <div class="fzd-lb-user">
                <div class="fzd-lb-name">${escapeHtml(item.player_name)}</div>
                <div class="fzd-lb-time">${formatRelativeTime(item.created_at)}</div>
              </div>
              <div class="fzd-lb-score">${escapeHtml(item.score_display)}</div>
            </div>
          `;
        });

        listContainer.innerHTML = html;
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        listContainer.innerHTML = '<div class="fzd-lb-empty">加载失败，请检查网络</div>';
      }
    },

    /**
     * 游戏结算时弹出提交成绩提示
     * @param {Object} options - { gameId, score, scoreDisplay, extraInfo, onSubmitted }
     */
    submitPrompt: function(options) {
      injectStyles();
      const { gameId, score, scoreDisplay, extraInfo, onSubmitted } = options;
      this.currentGameId = gameId || this.currentGameId;

      let backdrop = document.getElementById('fzd-lb-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'fzd-lb-modal-backdrop';
        backdrop.className = 'fzd-lb-modal-backdrop';
        document.body.appendChild(backdrop);
      }

      const defaultName = localStorage.getItem('fzd_player_name') || '';
      const displayScore = scoreDisplay || `${score} 分`;
      const gameTitle = GAME_NAMES[this.currentGameId] || '小游戏';

      backdrop.innerHTML = `
        <div class="fzd-lb-modal" onclick="event.stopPropagation()">
          <div class="fzd-lb-header">
            <button class="fzd-lb-close" id="fzd-lb-close-btn" aria-label="关闭">✕</button>
            <h3 class="fzd-lb-title">🎉 成绩出炉！</h3>
            <div class="fzd-lb-subtitle">${gameTitle}</div>
          </div>
          <div class="fzd-lb-prompt-box">
            <div class="fzd-lb-prompt-title">本次战绩</div>
            <div class="fzd-lb-prompt-score">${escapeHtml(displayScore)}</div>
            <div class="fzd-lb-input-group">
              <input type="text" id="fzd-lb-nickname-input" class="fzd-lb-input" placeholder="输入昵称登榜" maxlength="16" value="${escapeHtml(defaultName)}" />
              <button id="fzd-lb-submit-btn" class="fzd-lb-btn-submit">上传战绩</button>
            </div>
            <div id="fzd-lb-status-msg" style="margin-top: 8px; font-size: 0.85rem; color: #64748b;"></div>
          </div>
          <div class="fzd-lb-tabs">
            <button class="fzd-lb-tab ${this.currentPeriod === 'all' ? 'active' : ''}" data-period="all">总荣誉榜</button>
            <button class="fzd-lb-tab ${this.currentPeriod === 'today' ? 'active' : ''}" data-period="today">今日榜单</button>
          </div>
          <div id="fzd-lb-list" class="fzd-lb-body">
            <div class="fzd-lb-loading">正在拉取排名...</div>
          </div>
        </div>
      `;

      setTimeout(() => backdrop.classList.add('show'), 10);
      document.getElementById('fzd-lb-close-btn').onclick = () => this.hide();
      backdrop.onclick = (e) => {
        if (e.target === backdrop) this.hide();
      };

      const submitBtn = document.getElementById('fzd-lb-submit-btn');
      const nameInput = document.getElementById('fzd-lb-nickname-input');
      const statusMsg = document.getElementById('fzd-lb-status-msg');

      submitBtn.onclick = async () => {
        const nickname = nameInput.value.trim() || '匿名樊星';
        localStorage.setItem('fzd_player_name', nickname);

        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
        statusMsg.textContent = '';

        try {
          const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              game_id: this.currentGameId,
              player_name: nickname,
              score: score,
              score_display: displayScore,
              extra_info: extraInfo
            })
          });
          const json = await res.json();

          if (json.success) {
            statusMsg.style.color = '#15803d';
            statusMsg.textContent = json.message || '成绩已登榜！';
            submitBtn.textContent = '已登榜 ✓';
            this.loadData();
            if (typeof onSubmitted === 'function') onSubmitted(json);
          } else {
            statusMsg.style.color = '#dc2626';
            statusMsg.textContent = json.error || '提交失败';
            submitBtn.disabled = false;
            submitBtn.textContent = '重新提交';
          }
        } catch (e) {
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = '网络异常，请重试';
          submitBtn.disabled = false;
          submitBtn.textContent = '重新提交';
        }
      };

      const tabs = backdrop.querySelectorAll('.fzd-lb-tab');
      tabs.forEach(tab => {
        tab.onclick = () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.currentPeriod = tab.dataset.period;
          this.loadData();
        };
      });

      this.loadData();
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.FzdLeaderboard = Leaderboard;
})(window);
