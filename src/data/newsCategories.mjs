// 快讯分类定义 —— 网站页面、同步脚本、起草脚本共用这一份，改配色/图标只改这里。
// 配色对齐主站蓝白体系：主色 #1e88e5，其余用同色系深浅 + 少量点缀，不用高饱和杂色。
export const NEWS_CATEGORIES = {
  business:   { label: '商务', icon: '💼', color: '#1e88e5' },
  promo:      { label: '宣传', icon: '📣', color: '#5c6bc0' },
  match:      { label: '赛事', icon: '🏓', color: '#1565c0' },
  appearance: { label: '出席', icon: '📍', color: '#26a69a' },
  other:      { label: '其他', icon: '📌', color: '#78909c' }
};

// 枚举顺序（用于筛选器排列 & LLM 起草时的合法取值）
export const NEWS_CATEGORY_KEYS = Object.keys(NEWS_CATEGORIES);

export function categoryMeta(key) {
  return NEWS_CATEGORIES[key] || NEWS_CATEGORIES.other;
}
