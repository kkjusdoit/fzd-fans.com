import { news, categories } from '../../data/news';

interface NewsItem {
  date: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  title: string;
  summary: string;
  image: string;
  source: string;
}

interface YearGroup {
  year: string;
  list: NewsItem[];
}

function groupByYear(list: NewsItem[]): YearGroup[] {
  const groups: YearGroup[] = [];
  list.forEach((n) => {
    const year = (n.date || '').slice(0, 4) || '其他';
    let g = groups.find((x) => x.year === year);
    if (!g) { g = { year, list: [] }; groups.push(g); }
    g.list.push(n);
  });
  return groups.sort((a, b) => Number(b.year) - Number(a.year));
}

Page({
  data: {
    categories: categories as any[],
    allNews: news as NewsItem[],
    groups: [] as YearGroup[],
    activeCat: 'all'
  },

  onLoad() {
    this.applyFilter('all');
  },

  onFilterTap(e: any) {
    const cat = e.currentTarget.dataset.cat as string;
    this.applyFilter(cat);
  },

  applyFilter(cat: string) {
    const all = this.data.allNews;
    const visible = cat === 'all' ? all : all.filter((n) => n.category === cat);
    this.setData({ activeCat: cat, groups: groupByYear(visible) });
  },

  onPreviewImage(e: any) {
    const src = e.currentTarget.dataset.src as string;
    if (!src) return;
    const urls = this.data.allNews.map((n) => n.image).filter(Boolean);
    wx.previewImage({ current: src, urls });
  },

  onShareAppMessage() {
    return {
      title: '樊振东快讯 · 樊振东的互联网档案馆',
      path: '/pages/news/news'
    };
  },
  onShareTimeline() {
    return { title: '樊振东快讯 · 樊振东的互联网档案馆' };
  }
});
