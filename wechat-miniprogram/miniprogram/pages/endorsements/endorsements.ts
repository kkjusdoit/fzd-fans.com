import { endorsements, types, stats } from '../../data/endorsements';

interface Group {
  year: string;
  list: any[];
}

function yearOf(signDate: string): string {
  const m = String(signDate).match(/(\d{4})/);
  return m ? m[1] : '其他';
}

function buildGroups(list: any[]): Group[] {
  const map: Record<string, any[]> = {};
  list.forEach((i) => {
    const y = yearOf(i.signDate);
    (map[y] = map[y] || []).push(i);
  });
  return Object.keys(map)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({ year, list: map[year] }));
}

// 破圈广度：行业标签 + 数量
function buildBreadth(list: any[]) {
  const map: Record<string, number> = {};
  list.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
  return Object.keys(map).map((category) => ({ category, count: map[category] }));
}

Page({
  data: {
    types: types as any[],
    stats: stats as any,
    breadth: buildBreadth(endorsements as any[]),
    all: endorsements as any[],
    groups: [] as Group[],
    activeType: 'all'
  },

  onLoad() {
    this.applyFilter('all');
  },

  onFilterTap(e: any) {
    this.applyFilter(e.currentTarget.dataset.type as string);
  },

  applyFilter(type: string) {
    const all = this.data.all;
    const filtered = type === 'all' ? all : all.filter((i) => i.type === type);
    this.setData({ activeType: type, groups: buildGroups(filtered) });
  },

  copyEmail() {
    wx.setClipboardData({
      data: 'kkjusdoit@gmail.com',
      success: () => {
        wx.showToast({ title: '邮箱已复制', icon: 'success' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '樊振东 · 同行者(效力球队与代言品牌) · 樊振东的互联网档案馆',
      path: '/pages/endorsements/endorsements'
    };
  },
  onShareTimeline() {
    return { title: '樊振东 · 同行者 · 樊振东的互联网档案馆' };
  }
});
