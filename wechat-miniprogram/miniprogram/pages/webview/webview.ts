interface GameItem {
  icon: string;
  title: string;
  desc: string;
  url: string;
}

Component({
  data: {
    showGames: false,
    games: [
      {
        icon: '💥',
        title: '打爆一切',
        desc: '点击击碎所有荒谬谣言、抹黑与诋毁！',
        url: 'https://fzd-fans.com/breakit'
      },
      {
        icon: '🏓',
        title: '咚了个咚',
        desc: '樊振东主题消除游戏，朝着巴黎之巅进发！',
        url: 'https://fzd-fans.com/game.html'
      },
      {
        icon: '✨',
        title: '咚咚消消乐',
        desc: '经典的三消挑战，解压休闲两不误！',
        url: 'https://fzd-fans.com/match3.html'
      }
    ] as GameItem[]
  },
  pageLifetimes: {
    show() {
      const now = new Date();
      // @ts-ignore
      const isDouyin = typeof tt !== 'undefined';
      const targetDate = isDouyin ? new Date('2026-08-01T00:00:00') : new Date('2026-07-15T00:00:00');
      this.setData({
        showGames: now > targetDate
      });
    }
  },
  methods: {
    onLoad() {
      // Static game list page
    },
    copyLink(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({
            title: '链接已复制',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  }
});
