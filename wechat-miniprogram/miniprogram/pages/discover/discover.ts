Component({
  data: {},
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
