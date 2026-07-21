import { content } from '../../data/content';
import { news } from '../../data/news';
import { endorsements } from '../../data/endorsements';

const CATEGORY_MAP: Record<string, { zh: string; en: string }> = {
  fzd101: { zh: 'FZD 101', en: 'FZD 101' },
  stars: { zh: '天际樊星', en: 'Starry Sky' },
  arena: { zh: '职业生涯', en: 'Career' },
  quotes: { zh: '语录与梗', en: 'Quotes & Memes' },
  friends: { zh: '贵人与朋友', en: 'Friends & Mentors' },
  tributes: { zh: '评价与祝福', en: 'Tributes' },
  ugc: { zh: '投稿', en: 'Fan Submissions' },
  links: { zh: '媒体链接', en: 'Links' },
  warrior: { zh: '孤勇者', en: 'Lone Warrior' }
};

const CATEGORY_ICONS: Record<string, string> = {
  fzd101: '💡',
  stars: '🌌',
  arena: '🏓',
  quotes: '💬',
  friends: '🤝',
  tributes: '🎖️',
  ugc: '✍️',
  links: '🔗',
  warrior: '🛡️'
};

const CATEGORY_ORDER = [
  'fzd101',
  'stars',
  'arena',
  'quotes',
  // 'friends', // Hidden
  'tributes',
  'ugc',
  'links',
  'warrior'
];

Component({
  data: {
    categories: [] as any[],
    currentLang: 'zh'
  },
  lifetimes: {
    attached() {
      this.initData();
    }
  },
  pageLifetimes: {
    show() {
      const app = getApp<IAppOption>();
      if (app.globalData.lang !== this.data.currentLang) {
        this.initData();
      }
    }
  },
  methods: {
    initData() {
      const app = getApp<IAppOption>();
      const lang = app.globalData.lang as 'zh' | 'en';
      
      const cats = new Set(content.map((c: any) => c.category));
      
      const categories = CATEGORY_ORDER
        .filter(c => {
          if (c === 'arena') return true; // 强制包含职业生涯
          return cats.has(c);
        })
        .filter(c => {
          // Hide 'fzd101' in Chinese mode
          if (lang === 'zh' && c === 'fzd101') {
            return false;
          }
          // Hide 'friends' in both modes (to match website)
          if (c === 'friends') {
            return false;
          }
          return true;
        })
        .map(c => {
          let count = content.filter((item: any) => item.category === c && item.lang === lang).length;
          if (c === 'arena') {
            count = 11; // 11个核心赛场时刻
          }
          return {
            id: c,
            name: CATEGORY_MAP[c]?.[lang] || c,
            count,
            icon: CATEGORY_ICONS[c] || '📄'
          };
        });

      // 注入「快讯」入口（非 content 栏目，数据来自 news.js）
      categories.unshift({
        id: 'news',
        name: lang === 'zh' ? '快讯' : 'News',
        count: (news as any[]).length,
        icon: '📰'
      });

      // 注入「同行者」入口（效力球队 + 品牌代言，数据来自 endorsements.js）
      categories.push({
        id: 'endorsements',
        name: lang === 'zh' ? '同行者' : 'Companions',
        count: (endorsements as any[]).length,
        icon: '🤝'
      });

      this.setData({
        categories,
        currentLang: lang
      });
    },

    onCategoryTap(e: any) {
      const category = e.currentTarget.dataset.category;
      if (category === 'news') {
        wx.navigateTo({
          url: '../news/news'
        });
      } else if (category === 'endorsements') {
        wx.navigateTo({
          url: '../endorsements/endorsements'
        });
      } else if (category === 'arena') {
        wx.navigateTo({
          url: '../timeline/timeline'
        });
      } else {
        wx.navigateTo({
          url: `../category/category?id=${category}`
        });
      }
    },
    
    toggleLang() {
      const newLang = this.data.currentLang === 'zh' ? 'en' : 'zh';
      const app = getApp<IAppOption>();
      app.globalData.lang = newLang;
      wx.setStorageSync('lang', newLang);
      
      this.initData();
      
      wx.showToast({
        title: newLang === 'zh' ? '已切换至中文' : 'Switched to English',
        icon: 'none'
      });
    },
    onShareAppMessage() {
      return {
        title: '樊振东的互联网档案馆 · fzd-fans.com',
        path: '/pages/index/index'
      };
    },
    onShareTimeline() {
      return {
        title: '樊振东的互联网档案馆 · fzd-fans.com'
      };
    }
  }
});
