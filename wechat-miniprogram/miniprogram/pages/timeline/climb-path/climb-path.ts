Component({
  data: {
    imageLoaded: false
  },
  methods: {
    onImageLoad() {
      this.setData({
        imageLoaded: true
      });
    },
    onShareAppMessage() {
      return {
        title: '樊振东 · 登峰之路荣誉长图',
        path: '/pages/timeline/climb-path/climb-path'
      };
    },
    onShareTimeline() {
      return {
        title: '樊振东 · 登峰之路荣誉长图'
      };
    }
  }
});
