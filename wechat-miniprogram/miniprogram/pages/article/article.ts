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
        // Deep copy to prevent modifying the database module
        const articleCopy = JSON.parse(JSON.stringify(article));
        
        // Dynamic replacement: replace any iframe (like Bilibili embedded players) with a clean link card
        let body = articleCopy.body || '';
        const iframeRegex = /<iframe[^>]*src="[^"]*bvid=([a-zA-Z0-9]+)[^"]*"[^>]*><\/iframe>/g;
        body = body.replace(iframeRegex, (_: string, bvid: string) => {
          return `<a href="https://www.bilibili.com/video/${bvid}" class="video-link-btn" style="display:block;padding:12px;margin:10px 0;background-color:#f1f5f9;color:#1e88e5;text-align:center;border-radius:8px;font-size:13px;font-weight:500;border:1px solid #cbd5e1;">🎬 点击复制B站视频链接（${bvid}）前往观看</a>`;
        });
        
        articleCopy.body = body;
        
        this.setData({ article: articleCopy });
        wx.setNavigationBarTitle({
          title: articleCopy.title
        });
      }
    },
    
    onLinkTap(e: any) {
      const href = e.detail.href;
      if (!href) return;
      
      // If it's a WeChat Official Account article, open it in our custom webview page
      if (href.startsWith('https://mp.weixin.qq.com/')) {
        wx.navigateTo({
          url: `/pages/article-webview/article-webview?url=${encodeURIComponent(href)}`
        });
      } else {
        // Otherwise, copy to clipboard for external links (Bilibili, Weibo, email, etc.)
        let copyData = href;
        let isMail = false;
        
        if (href.startsWith('mailto:')) {
          copyData = href.replace('mailto:', '');
          isMail = true;
        }
        
        wx.setClipboardData({
          data: copyData,
          success: () => {
            wx.showToast({
              title: isMail ? '邮箱已复制，欢迎投稿' : '链接已复制，请在浏览器中打开',
              icon: 'none',
              duration: 2500
            });
          }
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
});
