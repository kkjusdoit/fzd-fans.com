interface TimelineEvent {
  year: string;
  title: string;
  desc: string;
  detail: string;
  type: 'win' | 'gold' | 'loss' | 'move' | 'rank' | 'start';
  typeLabel: string;
  expanded?: boolean;
}

const TIMELINE_DATA: TimelineEvent[] = [
  {
    year: '2012',
    title: '初出茅庐',
    desc: '进入国家一队，迅速展现惊人天赋，成为史上最年轻的世界冠军之一。',
    detail: '2012年樊振东进入国家一队，并在次年的全运会上一鸣惊人，夺得男团和男双冠军。2014年东京世乒赛随队获得团体金牌，以17岁的年纪成为中国男乒历史上最年轻的世界冠军之一。',
    type: 'start',
    typeLabel: '生涯起点'
  },
  {
    year: '2016',
    title: '世界杯首冠',
    desc: '在男乒世界杯中夺冠，确立了自己在世界乒坛的顶级地位，开启了对世界杯赛事的统治。',
    detail: '在德国萨尔布吕肯举行的世界杯决赛中，樊振东以 4-1 战胜队友许昕，夺得个人职业生涯首个单打世界冠军，确立了新一代领军人物的地位。',
    type: 'win',
    typeLabel: '世界冠军'
  },
  {
    year: '2018',
    title: '登顶世界第一',
    desc: '首次登顶世界排名第一，开启了长达数年的霸榜时代，积分一度断层领先。',
    detail: '2018年4月，樊振东首次超越马龙，登顶ITTF男单世界第一。在此后的五年里，他几乎长时间霸占榜首，统治力惊人。',
    type: 'rank',
    typeLabel: '世界第一'
  },
  {
    year: '2021',
    title: '休斯顿登顶',
    desc: '在休斯顿世乒赛男单决赛中获胜，终于捧起圣勃莱德杯，不仅是技术上的胜利，更是心理上的蜕变。',
    detail: '在休斯顿世乒赛男单决赛中，樊振东 4-0 横扫莫雷高德，首次捧起圣勃莱德杯，完成了他在单打项目上最核心的技术与心理蜕变。',
    type: 'win',
    typeLabel: '世乒捧杯'
  },
  {
    year: '2023',
    title: '卫冕世乒赛',
    desc: '在德班世乒赛成功卫冕，证明了自己的绝对统治力，无可超越的历史记录不断刷新。',
    detail: '在德班世乒赛男单决赛中，樊振东 4-2 击败马龙，成功卫冕世乒赛单打冠军。小胖赛后动情说到：“梦想没有大小没有版图没有边界”。',
    type: 'win',
    typeLabel: '世乒卫冕'
  },
  {
    year: '2024',
    title: '巴黎奥运圆梦',
    desc: '在巴黎奥运会男单决赛中顶住巨大压力夺金，完成职业生涯"大满贯"拼图，达到生涯巅峰。',
    detail: '在队友爆冷出局、独守上半区的极端压力下，樊振东在1/4决赛挽救绝境逆转张本智和，并一路击败莫雷高德夺冠，完成了乒乓球大满贯伟业！',
    type: 'gold',
    typeLabel: '奥运夺金'
  },
  {
    year: '2024 Late',
    title: '排名消失 & 处罚',
    desc: '因缺席WTT赛事被国际乒联赋零分，导致世界排名迅速下滑直至消失，引发全球热议。',
    detail: '巴黎奥运会后，樊振东选择休整，缺席了多站WTT商业比赛。由于未参赛积分直接被赋零，导致其世界排名快速跌落直至消失，引发对商业赛制的广泛讨论。',
    type: 'loss',
    typeLabel: '排名消失'
  },
  {
    year: '2025',
    title: '出走德甲',
    desc: '宣布加盟德国乒乓球甲级联赛，寻求新的挑战与环境，标志着职业生涯进入全新阶段。',
    detail: '2025年小胖宣布加盟德甲联赛萨尔布吕肯俱乐部。这一举动被普遍认为是他远离国内饭圈文化侵扰、重寻乒乓纯粹乐趣的重要决定。',
    type: 'move',
    typeLabel: '加盟德甲'
  },
  {
    year: '2025.11',
    title: '卫冕全运会冠军',
    desc: '在澳门第十五届全国运动会男单决赛中以 4-1 击败林诗栋，成功卫冕全运会单打冠军。',
    detail: '在第十五届全运会男单决赛中，樊振东4-1战胜新星林诗栋，成功实现全运会男单卫冕，成为奖牌数量瞩目的全运六金王。',
    type: 'win',
    typeLabel: '全运六金'
  },
  {
    year: '2026.06',
    title: '德甲“三冠王”与 MVP',
    desc: '率领萨尔布吕肯俱乐部夺得德国杯、欧冠、德甲三冠王，个人以常规赛超 90% 胜率及决赛独得两分的表现，荣膺赛季德甲 MVP。',
    detail: '在德甲第一个赛季，樊振东以超90%的惊人胜率帮助萨尔布吕肯取得大满贯。在决赛中独得两分，横扫对手，荣膺本赛季德甲联赛最有价值球员 (MVP)。',
    type: 'win',
    typeLabel: '德甲三冠'
  },
  {
    year: '2026.07',
    title: '加盟杜塞尔多夫',
    desc: '合同期满离开萨尔布吕肯，正式转会加盟德甲传统豪门杜塞尔多夫俱乐部，携手老友波尔在新赛季迎接挑战。',
    detail: '2026年7月，樊振东宣布转会加盟传统豪门杜塞尔多夫，与传奇老将蒂莫·波尔并肩作战。这是他在欧洲的全新冒险，也将继续享受纯粹的乒乓生活。',
    type: 'move',
    typeLabel: '豪门转会'
  }
];

Component({
  data: {
    timelineData: [] as TimelineEvent[]
  },
  lifetimes: {
    attached() {
      const data = TIMELINE_DATA.map(item => ({
        ...item,
        expanded: false
      }));
      this.setData({
        timelineData: data
      });
    }
  },
  methods: {
    toggleItem(e: any) {
      const index = e.currentTarget.dataset.index;
      const data = [...this.data.timelineData];
      data[index].expanded = !data[index].expanded;
      this.setData({
        timelineData: data
      });
    },

    onPreviewClimbPath() {
      wx.navigateTo({
        url: '/pages/timeline/climb-path/climb-path'
      });
    },
    onShareAppMessage() {
      return {
        title: '生涯里程碑 · 樊振东的互联网档案馆',
        path: '/pages/timeline/timeline'
      };
    },
    onShareTimeline() {
      return {
        title: '生涯里程碑 · 樊振东的互联网档案馆'
      };
    }
  }
});
