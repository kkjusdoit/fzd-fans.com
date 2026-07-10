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
    copyOfficialAccount(e: any) {
      const id = e.currentTarget.dataset.id || 'kkjusdoit';
      wx.setClipboardData({
        data: id,
        success: () => {
          wx.showModal({
            title: '公众号已复制',
            content: `已成功复制公众号ID：${id}\n请在微信中搜索并关注该公众号发消息留言！`,
            showCancel: false,
            confirmText: '我知道了'
          });
        }
      });
    },
    copyEmail(e: any) {
      const email = e.currentTarget.dataset.email || 'kkjusdoit@gmail.com';
      wx.setClipboardData({
        data: email,
        success: () => {
          wx.showToast({
            title: '邮箱已复制，欢迎投稿',
            icon: 'none',
            duration: 2500
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
