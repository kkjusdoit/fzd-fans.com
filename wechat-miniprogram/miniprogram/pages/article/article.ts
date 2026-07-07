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
    }
  }
})
