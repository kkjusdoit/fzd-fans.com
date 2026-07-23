Component({
  data: {
    showGames: false
  },
  pageLifetimes: {
    show() {
      const now = new Date();
      // @ts-ignore
      const isDouyin = typeof tt !== 'undefined';
      const targetDate = isDouyin ? new Date('2026-08-01T00:00:00') : new Date('2026-07-15T00:00:00');
      const isUnlocked = now > targetDate;
      this.setData({
        showGames: isUnlocked,
        showDomain: isUnlocked
      });
    }
  },
  methods: {
    navigateTo(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url
      });
    },
    onShareAppMessage() {
      return {
        title: '发现 · 樊振东的互联网档案馆',
        path: '/pages/discover/discover'
      };
    },
    onShareTimeline() {
      return {
        title: '发现 · 樊振东的互联网档案馆'
      };
    }
  }
});
