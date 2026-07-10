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
