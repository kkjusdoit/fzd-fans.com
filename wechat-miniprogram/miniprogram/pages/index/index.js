"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_1 = require("../../data/content");
const CATEGORY_MAP = {
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
const CATEGORY_ICONS = {
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
        categories: [],
        currentLang: 'zh'
    },
    lifetimes: {
        attached() {
            this.initData();
        }
    },
    pageLifetimes: {
        show() {
            const app = getApp();
            if (app.globalData.lang !== this.data.currentLang) {
                this.initData();
            }
        }
    },
    methods: {
        initData() {
            const app = getApp();
            const lang = app.globalData.lang;
            const cats = new Set(content_1.content.map((c) => c.category));
            const categories = CATEGORY_ORDER
                .filter(c => cats.has(c))
                .filter(c => {
                // Hide 'fzd101' in Chinese mode
                if (lang === 'zh' && c === 'fzd101') {
                    return false;
                }
                // Hide 'friends' in both modes
                if (c === 'friends')
                    return false;
                return true;
            })
                .map(c => ({
                id: c,
                name: CATEGORY_MAP[c]?.[lang] || c,
                count: content_1.content.filter((item) => item.category === c && item.lang === lang).length,
                icon: CATEGORY_ICONS[c] || '📄'
            }));
            this.setData({
                categories,
                currentLang: lang
            });
        },
        onCategoryTap(e) {
            const category = e.currentTarget.dataset.category;
            wx.navigateTo({
                url: `../category/category?id=${category}`
            });
        },
        toggleLang() {
            const newLang = this.data.currentLang === 'zh' ? 'en' : 'zh';
            const app = getApp();
            app.globalData.lang = newLang;
            wx.setStorageSync('lang', newLang);
            this.initData();
            wx.showToast({
                title: newLang === 'zh' ? '已切换至中文' : 'Switched to English',
                icon: 'none'
            });
        }
    }
});
