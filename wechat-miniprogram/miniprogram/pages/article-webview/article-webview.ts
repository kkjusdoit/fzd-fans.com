Component({
  data: {
    url: ''
  },
  methods: {
    onLoad(options: any) {
      if (options.url) {
        const decodedUrl = decodeURIComponent(options.url);
        this.setData({
          url: decodedUrl
        });
      }
    }
  }
});
