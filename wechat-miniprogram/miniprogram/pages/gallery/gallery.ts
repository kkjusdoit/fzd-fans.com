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
      console.log('Gallery component attached');
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
      console.log('Gallery loadData called, isRefresh:', isRefresh);
      if (this.data.isLoading) return;
      this.setData({ isLoading: true });

      const targetPage = isRefresh ? 1 : this.data.page + 1;

      try {
        const res = await new Promise<any>((resolve, reject) => {
          wx.request({
            url: 'https://fzd-fans.com/api/photos',
            data: {
              page: targetPage,
              limit: this.data.limit
            },
            success: resolve,
            fail: reject
          });
        });

        let responseData = res.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (e) {
            console.error('Failed to parse response data:', e);
          }
        }

        if (res.statusCode === 200 && responseData && Array.isArray(responseData.data)) {
          const newPhotos = responseData.data as Photo[];
          const updatedPhotos = isRefresh ? newPhotos : [...this.data.photos, ...newPhotos];
          
          const leftColumn: Photo[] = [];
          const rightColumn: Photo[] = [];
          updatedPhotos.forEach((item, index) => {
            if (index % 2 === 0) {
              leftColumn.push(item);
            } else {
              rightColumn.push(item);
            }
          });

          const meta = responseData.meta || {};
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
      } catch (err) {
        console.error('Fetch photos failed:', err);
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
      } finally {
        this.setData({ isLoading: false });
      }
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
