"use strict";
Component({
    data: {
        url: ''
    },
    methods: {
        onLoad(options) {
            if (options.url) {
                // Decode URL if passed
                const decoded = decodeURIComponent(options.url);
                this.setData({
                    url: decoded
                });
                // Set dynamic title if name parameter exists
                if (options.name) {
                    wx.setNavigationBarTitle({
                        title: decodeURIComponent(options.name)
                    });
                }
            }
        },
        playGame(e) {
            const url = e.currentTarget.dataset.url;
            this.setData({
                url
            });
        }
    }
});
