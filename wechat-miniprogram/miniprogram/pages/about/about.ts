// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    showWebsiteLink: false
  },
  pageLifetimes: {
    show() {
      const now = new Date();
      // @ts-ignore
      const isDouyin = typeof tt !== 'undefined';
      const targetDate = isDouyin ? new Date('2026-08-01T00:00:00') : new Date('2026-07-15T00:00:00');
      this.setData({
        showWebsiteLink: now > targetDate
      });
    }
  },
  methods: {
    // 事件处理函数
    toCases() {
      console.log(123)
      wx.navigateTo({
        url: '../cases/cases',
      })
    },
    openArticle(e: any) {
      const url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url: `/pages/article-webview/article-webview?url=${encodeURIComponent(url)}`
      });
    },
    copyEmail(e: any) {
      const email = e.currentTarget.dataset.email || 'kkjusdoit@gmail.com';
      wx.setClipboardData({
        data: email,
        success: () => {
          wx.showToast({
            title: '邮箱已复制',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
    onShareAppMessage() {
      return {
        title: '关于 · 樊振东的互联网档案馆',
        path: '/pages/about/about'
      };
    },
    onShareTimeline() {
      return {
        title: '关于 · 樊振东的互联网档案馆'
      };
    }
  },
})
