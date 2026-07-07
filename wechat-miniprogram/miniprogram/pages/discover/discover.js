"use strict";
Component({
    data: {},
    methods: {
        navigateTo(e) {
            const url = e.currentTarget.dataset.url;
            wx.navigateTo({
                url
            });
        }
    }
});
