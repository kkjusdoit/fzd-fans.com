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
Component({
    data: {
        articles: [],
        categoryName: '',
        categoryId: ''
    },
    methods: {
        onLoad(options) {
            const categoryId = options.id;
            this.setData({
                categoryId
            });
            this.loadArticles();
        },
        onShow() {
            // 每次显示页面时重新加载，以防语言切换
            this.loadArticles();
        },
        loadArticles() {
            const app = getApp();
            const lang = app.globalData.lang;
            const categoryId = this.data.categoryId;
            if (!categoryId)
                return;
            const name = CATEGORY_MAP[categoryId]?.[lang] || categoryId;
            const filtered = content_1.content.filter((item) => item.category === categoryId && item.lang === lang);
            this.setData({
                articles: filtered,
                categoryName: name
            });
            wx.setNavigationBarTitle({
                title: name
            });
        },
        onArticleTap(e) {
            const id = e.currentTarget.dataset.id;
            wx.navigateTo({
                url: `../article/article?id=${id}`
            });
        }
    }
});
