"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const content_1 = require("../../data/content");
Component({
    data: {
        article: null
    },
    methods: {
        onLoad(options) {
            const id = options.id;
            const article = content_1.content.find((item) => item.id === id);
            if (article) {
                this.setData({ article });
                wx.setNavigationBarTitle({
                    title: article.title
                });
            }
        }
    }
});
