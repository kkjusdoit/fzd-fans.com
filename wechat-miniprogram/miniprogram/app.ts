// app.ts
App<IAppOption>({
  globalData: {
    lang: 'zh' // 默认为中文
  },
  onLaunch() {
    console.log('App launch triggered!!!');
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    // 初始化语言设置
    // @ts-ignore
    const isDouyin = typeof tt !== 'undefined';
    const savedLang = wx.getStorageSync('lang');
    if (isDouyin) {
      this.globalData.lang = 'zh'; // 抖音强制中文，因平台不允许外语小程序
    } else if (savedLang) {
      this.globalData.lang = savedLang;
    }
  },
})
