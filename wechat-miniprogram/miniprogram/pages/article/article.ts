import { content } from '../../data/content';

Component({
  data: {
    article: null as any
  },
  methods: {
    onLoad(options: any) {
      const id = options.id;
      const article = content.find((item: any) => item.id === id);
      
      if (article) {
        this.setData({ article });
        wx.setNavigationBarTitle({
          title: article.title
        });
      }
    },
    onShareAppMessage() {
      const article = this.data.article;
      return {
        title: article ? `${article.title} · 樊振东的互联网档案馆` : '樊振东的互联网档案馆',
        path: article ? `/pages/article/article?id=${article.id}` : '/pages/index/index'
      };
    },
    onShareTimeline() {
      const article = this.data.article;
      return {
        title: article ? `${article.title} · 樊振东的互联网档案馆` : '樊振东的互联网档案馆',
        query: article ? `id=${article.id}` : ''
      };
    }
  }
})
