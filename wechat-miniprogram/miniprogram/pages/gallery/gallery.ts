interface Photo {
  id: number;
  name: string;
  url: string;
  created_at: number;
}

Component({
  data: {
    photos: [] as Photo[],
    leftColumn: [] as Photo[],
    rightColumn: [] as Photo[],
    page: 1,
    limit: 14,
    hasMore: true,
    isLoading: false
  },
  lifetimes: {
    attached() {
      this.loadData(true);
    }
  },
  methods: {
    onPullDownRefresh() {
      this.loadData(true).then(() => {
        wx.stopPullDownRefresh();
      });
    },

    onReachBottom() {
      if (this.data.hasMore && !this.data.isLoading) {
        this.loadData(false);
      }
    },

    async loadData(isRefresh = false) {
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });

      const targetPage = isRefresh ? 1 : this.data.page + 1;

      return new Promise<void>((resolve) => {
        wx.request({
          url: 'https://fzd-fans.com/api/photos',
          data: {
            page: targetPage,
            limit: this.data.limit
          },
          success: (res: any) => {
            if (res.statusCode === 200 && res.data && Array.isArray(res.data.data)) {
              const newPhotos = res.data.data as Photo[];
              const updatedPhotos = isRefresh ? newPhotos : [...this.data.photos, ...newPhotos];
              
              // Split into columns for masonry look
              const leftColumn: Photo[] = [];
              const rightColumn: Photo[] = [];
              updatedPhotos.forEach((item, index) => {
                if (index % 2 === 0) {
                  leftColumn.push(item);
                } else {
                  rightColumn.push(item);
                }
              });

              const meta = res.data.meta || {};
              const hasMore = meta.hasMore !== undefined ? meta.hasMore : (newPhotos.length === this.data.limit);

              this.setData({
                photos: updatedPhotos,
                leftColumn,
                rightColumn,
                page: targetPage,
                hasMore
              });
            } else {
              wx.showToast({
                title: '获取照片失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('Fetch photos failed:', err);
            wx.showToast({
              title: '网络连接失败',
              icon: 'none'
            });
          },
          complete: () => {
            this.setData({ isLoading: false });
            resolve();
          }
        });
      });
    },

    onPhotoTap(e: any) {
      const currentUrl = e.currentTarget.dataset.url;
      const urls = this.data.photos.map(p => p.url);
      
      wx.previewImage({
        current: currentUrl,
        urls: urls
      });
    }
  }
});
