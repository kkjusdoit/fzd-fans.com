// 商业版图（代言/合作）分类配置 —— 网站页面、同步脚本共用。
// 配色对齐主站蓝白体系（#1e88e5 主色），不再用金色。
// 三种关系用同一数据表 + type 枚举承载；status 表达合作生命周期。
// 增强字段：logo / officialUrl / productImage / editorNote（编者按，粉丝视角温度）。

export const ENDORSEMENT_TYPES = {
  commercial:     { label: '商业代言', icon: '💼', color: '#1e88e5' },
  public_welfare: { label: '公益身份', icon: '🤝', color: '#26a69a' },
  sports_club:    { label: '效力俱乐部', icon: '🏓', color: '#5c6bc0' }
};

export const ENDORSEMENT_STATUS = {
  active:    { label: '进行中', color: '#1e88e5' },
  completed: { label: '已结束', color: '#9e9e9e' }
};

export const ENDORSEMENT_TYPE_KEYS = Object.keys(ENDORSEMENT_TYPES);

export function typeMeta(k) { return ENDORSEMENT_TYPES[k] || ENDORSEMENT_TYPES.commercial; }
export function statusMeta(k) { return ENDORSEMENT_STATUS[k] || ENDORSEMENT_STATUS.active; }
