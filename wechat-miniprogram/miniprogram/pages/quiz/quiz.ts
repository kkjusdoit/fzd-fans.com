interface Question {
  type: 'choice' | 'truefalse' | 'multi' | 'fill';
  question: string;
  options?: string[];
  answer: number | number[] | string;
  explanation?: string;
  typeText?: string;
}

interface WrongAnswerRecord {
  q: string;
  userAns: string;
  correctAns: string;
}

const QUESTIONS: Question[] = [
  {
    type: 'choice',
    question: '1、樊振东最支持的足球队是：',
    options: ['A、皇马', 'B、利物浦', 'C、巴萨', 'D、马竞'],
    answer: 0,
    explanation: '【解析】送命题。小胖是忠实的美凌格（皇家马德里队歌球迷）。'
  },
  {
    type: 'choice',
    question: '2、樊振东踢足球时会挑选几号球衣？',
    options: ['A、97', 'B、99', 'C、1', 'D、122'],
    answer: 1,
    explanation: '【解析】来自乒乓世界2022年12月明星大调查。小胖喜欢99号球衣。'
  },
  {
    type: 'choice',
    question: '3、樊振东春暖花开时最想去哪里玩？',
    options: ['A、上海', 'B、巴黎', 'C、萨尔布吕肯', 'D、广州'],
    answer: 0,
    explanation: '【解析】来自乒乓世界2022年5月明星大调查。'
  },
  {
    type: 'choice',
    question: '4、樊振东觉得哪个《训练》项目练起来最累？',
    options: ['A、长跑', 'B、多球', 'C、跑位'],
    answer: 1,
    explanation: '【解析】来自乒乓世界2022年12月明星大调查。'
  },
  {
    type: 'choice',
    question: '5、樊振东最爱吃什么馅的月饼？',
    options: ['A、流沙', 'B、蛋黄', 'C、五仁', 'D、莲蓉'],
    answer: 0,
    explanation: '【解析】来自乒乓世界2020年10月明星大调查。'
  },
  {
    type: 'choice',
    question: '6、粤语"乜都劲"表示"什么都很厉害"，那么"乜说话"的意思是：',
    options: ['A、谁说话', 'B、什么都说话', 'C、不在话下', 'D、你客气啦'],
    answer: 3,
    explanation: '【解析】在粤语语境中，"乜说话"通常代表“这叫什么话 / 您太客气了”。'
  },
  {
    type: 'choice',
    question: '7、2025全运会吉祥物原型是一只：',
    options: ['A、白海豚', 'B、白切鸡', 'C、豉油鸡', 'D、熊猫'],
    answer: 0,
    explanation: '【解析】第十五届全国运动会吉祥物“喜洋洋”与“乐融融”是以中华白海豚为原型。'
  },
  {
    type: 'multi',
    question: '8、(多选)樊振东在如下大赛中曾经单枪匹马独守全区：',
    options: ['A、2024巴黎奥运会', 'B、2021休斯顿世乒赛', 'C、2019男乒世界杯', 'D、2019武汉军运会', 'E、2018男乒世界杯', 'F、2017亚锦赛'],
    answer: [0, 1, 2, 3, 4],
    explanation: '【解析】在这五次大赛中，樊振东都在面临队友意外出局时，独自一人守住整个半区打入决赛并最终夺冠。'
  },
  {
    type: 'multi',
    question: '9、(多选)巴黎奥运会前樊振东曾表达过的小期待，目前为止实现了的有：',
    options: ['A、专注于获得冠军的过程', 'B、在奥运村认识同为皇马球迷的纳达尔', 'C、在乒乓球比赛中跟魔笛一起对抗姆巴佩和贝林厄姆', 'D、见到另一位美凌格阿尔卡拉斯', 'E、冲击金牌'],
    answer: [0, 1, 3, 4],
    explanation: '【解析】C选项属于他的脑洞大开，并没有真的在乒乓球桌上实现。其他均已实现。'
  },
  {
    type: 'multi',
    question: '10、(多选)樊振东曾在如下城市获得过2次或以上冠军：',
    options: ['A、巴黎', 'B、威海', 'C、成都', 'D、新乡', 'E、新加坡'],
    answer: [0, 1, 2, 4],
    explanation: '【解析】巴黎：2018世界杯、2024奥运会；威海：2020世界杯、2020全锦赛；成都：2016公开赛、2019世界杯、2022世乒赛；新加坡：2021WTT杯、22/23WTT大满贯。新乡仅有23年一次。'
  },
  {
    type: 'multi',
    question: '11、(多选)樊振东喜欢的动物有：',
    options: ['A、熊', 'B、大象', 'C、猫', 'D、狗', 'E、兔'],
    answer: [0, 1],
    explanation: '【解析】源自乒乓世界2017年10月明星大调查。小胖最喜欢的动物是熊和大象。'
  },
  {
    type: 'multi',
    question: '12、(多选)欧冠乒乓球联赛在如下情况中视作胜利的有：',
    options: ['A、决胜局比分6-5', 'B、在淘汰赛中主场输，客场赢，第三场比赛在最后一盘单打中获胜', 'C、决胜局比分11-9', 'D、在淘汰赛中主场赢，客场输，第三场比赛在最后一盘双打中获胜'],
    answer: [0, 1],
    explanation: '【解析】欧冠乒乓球联赛没有双打，决胜局抢6。'
  },
  {
    type: 'multi',
    question: '13、(多选)关于棒球，正确的说法是：',
    options: ['A、"三振出局"是指击球员累计三击不中而被判出局', 'B、击球员击球时，球棒可以击打球的任何部位', 'C、棒球比赛标准局数为7局', 'D、当棒球员击出界外球时算作一个好球', 'E、棒球中的"二刀流"指的是既能担任投手又能担任击球员的球员'],
    answer: [0, 3, 4],
    explanation: '【解析】棒球比赛标准局数为9局。'
  },
  {
    type: 'truefalse',
    question: '14、樊振东是第一位参加德甲乒乓球联赛的中国运动员。',
    options: ['A、对', 'B、错'],
    answer: 1,
    explanation: '【解析】错误。在此之前有马文革等多名中国选手加盟过德甲。'
  },
  {
    type: 'fill',
    question: '15、(填空)2025全运会期间，樊振东表达过：永恒不变的是什么？',
    answer: '变化',
    explanation: '【解析】小胖的名言：“永恒不变的是变化，要在变化中找到自己能把握的。”'
  },
  {
    type: 'choice',
    question: '16、樊振东在比赛中，其极具威胁且运用频繁的反手技术是以下哪种？',
    options: ['A、反手拧拉', 'B、正手弧圈球', 'C、侧身暴冲', 'D、削球'],
    answer: 0,
    explanation: '【解析】反手拧拉是樊振东的核心前三板技术之一。'
  },
  {
    type: 'choice',
    question: '17、樊振东投资的美国乒乓球职业联赛简称：',
    options: ['A、MLTT', 'B、WTT', 'C、TBLL', 'D、ITTF'],
    answer: 0,
    explanation: '【解析】小胖投资加盟了美国职业乒乓球大联盟 (Major League Table Tennis, 简称 MLTT)。'
  },
  {
    type: 'choice',
    question: '18、西语中"1、2、3"发音正确的是：',
    options: ['A、cero、dos、uno', 'B、uno、dos、tres', 'C、tres、dos、uno', 'D、uno、dos、seis'],
    answer: 1,
    explanation: '【解析】西语中 1: uno, 2: dos, 3: tres。'
  },
  {
    type: 'multi',
    question: '19、(多选)樊振东对自己最满意的身体部位是：',
    options: ['A、手', 'B、脸', 'C、皮肤', 'D、腿', 'E、头发', 'F、眼睛'],
    answer: [0, 1],
    explanation: '【解析】乒乓世界2013年明星大调查选的是脸，2019年调查选的是手。'
  },
  {
    type: 'choice',
    question: '20、樊振东创造全运会最年轻单打冠军纪录是在哪一年？',
    options: ['A、2014年', 'B、2013年', 'C、2015年', 'D、2016年'],
    answer: 1,
    explanation: '【解析】2013年第12届全运会，樊振东一举夺得男团和男双冠军并杀入单打决赛。'
  },
  {
    type: 'choice',
    question: '21、樊振东曾四度获得的ITTF世界杯冠军是击败了几位不同对手实现的？',
    options: ['A、1位', 'B、2位', 'C、3位', 'D、4位'],
    answer: 3,
    explanation: '【解析】四次决赛击败的对手分别为：2016许昕、2018波尔、2019张本智和、2020马龙。'
  },
  {
    type: 'multi',
    question: '22、(多选)以下属于樊振东主要技术特点的有哪些？',
    options: ['A、反手拧拉', 'B、正手攻球', 'C、削球', 'D、中远台相持'],
    answer: [0, 1, 3],
    explanation: '【解析】小胖打法凶悍全面，反拧拉、正手发力与强悍的中远台相持为其核心。他并非防守削球手。'
  },
  {
    type: 'choice',
    question: '23、樊振东在足球场上最喜欢踢的位置是：',
    options: ['A、前锋', 'B、中场', 'C、后卫', 'D、守门员'],
    answer: 1,
    explanation: '【解析】来自乒乓世界2022年12月明星大调查。小胖最喜欢踢中场组织核心。'
  },
  {
    type: 'choice',
    question: '24、樊振东旅游时会买的纪念品是：',
    options: ['A、当地特色娃娃', 'B、当地特色美食', 'C、化妆品', 'D、徽章或冰箱贴'],
    answer: 3,
    explanation: '【解析】来自乒乓世界2021年5月明星大调查。'
  },
  {
    type: 'choice',
    question: '25、2016年乒超八一队夺冠，樊振东感谢团队时开玩笑道：“我们团队越来越给力了，我只能在底下吃（）”',
    options: ['A、巧克力', 'B、薯片', 'C、饼干', 'D、小香肠'],
    answer: 1,
    explanation: '【解析】经典老梗，“只能在底下吃薯片”。出自乒乓世界2016年12月刊。'
  },
  {
    type: 'fill',
    question: '26、(填空)2025全运会后，樊振东成为全运会历史上夺得金牌数量最多的几金王？',
    answer: '6',
    explanation: '【解析】小胖成为了全运会历史瞩目的“六金王”。'
  },
  {
    type: 'choice',
    question: '27、"梦想没有大小没有版图没有边界"是樊振东在哪次大赛夺冠后的采访？',
    options: ['A、2016世界杯', 'B、2020世界杯', 'C、2021世乒赛', 'D、2023世乒赛', 'E、2024巴黎奥运会'],
    answer: 3,
    explanation: '【解析】这是樊振东在2023年德班世乒赛男单成功卫冕夺冠后的经典感言。'
  },
  {
    type: 'choice',
    question: '28、"我希望能够成长得快一点，希望大家按主力队员对我提要求"是樊振东几岁时对自己的期许？',
    options: ['A、18岁', 'B、19岁', 'C、20岁', 'D、21岁'],
    answer: 0,
    explanation: '【解析】2015年5月CCTV5风云会中，18岁的小胖说出了这句展现他少年大志的话。'
  },
  {
    type: 'multi',
    question: '29、(多选)樊振东曾与以下哪些选手跨国或跨界组队参加过比赛？',
    options: ['A、朱世赫', 'B、莫雷高德', 'C、奥恰洛夫', 'D、林昀儒', 'E、黄镇廷', 'F、张之臻'],
    answer: [0, 1, 4, 5],
    explanation: '【解析】朱世赫、黄镇廷为16年亚欧对抗赛亚洲队队友；莫雷高德为德甲萨尔布吕肯俱乐部欧冠队友；张之臻为上海大师赛网球男双搭档。'
  }
];

const RANKS = [
  { min: 0, max: 2, title: '🌱 路人粉', desc: '刚开始了解小胖，继续加油！' },
  { min: 3, max: 5, title: '⭐ 普通球迷', desc: '有一定了解，但还需要多看比赛哦~' },
  { min: 6, max: 7, title: '🌟 资深球迷', desc: '不错不错，对小胖很熟悉了！' },
  { min: 8, max: 9, title: '💫 大满贯球迷', desc: '厉害！你是真正的樊星！' },
  { min: 10, max: 10, title: '🏆 超级金满贯球迷', desc: '满分！你比小胖还了解小胖！' }
];

Component({
  data: {
    state: 'intro', // intro | quiz | result
    questionsList: [] as Question[],
    currentIndex: 0,
    currentQuestion: {} as Question,
    hasAnswered: false,
    score: 0,
    peekCount: 1,
    fillValue: '',
    optionsWithStyles: [] as any[],
    wrongQuestions: [] as WrongAnswerRecord[],
    rankInfo: {} as any
  },

  methods: {
    shuffleArray<T>(array: T[]): T[] {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    startQuiz() {
      // Pick 10 random questions
      const shuffled = this.shuffleArray(QUESTIONS);
      const selected = shuffled.slice(0, 10).map(q => {
        let typeText = '单选题';
        if (q.type === 'multi') typeText = '多选题';
        else if (q.type === 'truefalse') typeText = '判断题';
        else if (q.type === 'fill') typeText = '填空题';
        
        return {
          ...q,
          typeText
        };
      });

      this.setData({
        state: 'quiz',
        questionsList: selected,
        currentIndex: 0,
        currentQuestion: selected[0],
        hasAnswered: false,
        score: 0,
        peekCount: 1,
        fillValue: '',
        wrongQuestions: []
      }, () => {
        this.renderQuestionOptions();
      });
    },

    renderQuestionOptions() {
      const q = this.data.currentQuestion;
      if (q.type === 'fill') {
        this.setData({
          fillValue: '',
          hasAnswered: false
        });
        return;
      }

      const options = q.options || [];
      const optionsWithStyles = options.map((opt) => {
        const letter = opt.slice(0, 2);
        const text = opt.slice(2);
        return {
          letter,
          text,
          styleClass: '',
          selected: false
        };
      });

      this.setData({
        optionsWithStyles,
        hasAnswered: false
      });
    },

    onOptionSelect(e: any) {
      if (this.data.hasAnswered) return;
      const index = e.currentTarget.dataset.index;
      const q = this.data.currentQuestion;
      const correctIndex = q.answer as number;

      const isCorrect = (index === correctIndex);
      const options = [...this.data.optionsWithStyles];
      
      options[correctIndex].styleClass = 'correct';
      if (!isCorrect) {
        options[index].styleClass = 'incorrect';
      }

      const wrongQuestions = [...this.data.wrongQuestions];
      if (!isCorrect) {
        wrongQuestions.push({
          q: q.question,
          userAns: q.options ? q.options[index] : '未知',
          correctAns: q.options ? q.options[correctIndex] : '未知'
        });
      }

      this.setData({
        optionsWithStyles: options,
        hasAnswered: true,
        score: isCorrect ? this.data.score + 1 : this.data.score,
        wrongQuestions
      });
    },

    onMultiOptionSelect(e: any) {
      if (this.data.hasAnswered) return;
      const index = e.currentTarget.dataset.index;
      const options = [...this.data.optionsWithStyles];
      options[index].selected = !options[index].selected;
      
      this.setData({
        optionsWithStyles: options
      });
    },

    onSubmitMulti() {
      if (this.data.hasAnswered) return;
      const q = this.data.currentQuestion;
      const correctAnswers = q.answer as number[]; // array of indices
      const options = [...this.data.optionsWithStyles];
      
      let isCorrect = true;
      
      // Highlight all options
      options.forEach((opt, idx) => {
        const isOptCorrect = correctAnswers.includes(idx);
        const isOptSelected = !!opt.selected;
        
        if (isOptCorrect) {
          opt.styleClass = 'correct';
          if (!isOptSelected) isCorrect = false; // should have selected it
        } else {
          if (isOptSelected) {
            opt.styleClass = 'incorrect'; // shouldn't have selected it
            isCorrect = false;
          }
        }
      });

      const wrongQuestions = [...this.data.wrongQuestions];
      if (!isCorrect) {
        const userSelStr = options.map((o) => o.selected ? o.letter : null).filter(Boolean).join(', ');
        const corrSelStr = correctAnswers.map(idx => q.options ? q.options[idx].slice(0, 2) : '').filter(Boolean).join(', ');
        wrongQuestions.push({
          q: q.question,
          userAns: userSelStr || '未选',
          correctAns: corrSelStr
        });
      }

      this.setData({
        optionsWithStyles: options,
        hasAnswered: true,
        score: isCorrect ? this.data.score + 1 : this.data.score,
        wrongQuestions
      });
    },

    onFillInput(e: any) {
      this.setData({
        fillValue: e.detail.value
      });
    },

    onSubmitFill() {
      if (this.data.hasAnswered) return;
      const q = this.data.currentQuestion;
      const cleanVal = this.data.fillValue.trim();
      const isCorrect = cleanVal === String(q.answer);

      const wrongQuestions = [...this.data.wrongQuestions];
      if (!isCorrect) {
        wrongQuestions.push({
          q: q.question,
          userAns: cleanVal || '未填',
          correctAns: String(q.answer)
        });
      }

      this.setData({
        hasAnswered: true,
        score: isCorrect ? this.data.score + 1 : this.data.score,
        wrongQuestions
      });
    },

    onPeek() {
      if (this.data.hasAnswered || this.data.peekCount === 0) return;
      
      const q = this.data.currentQuestion;
      
      if (q.type === 'choice' || q.type === 'truefalse') {
        const correctIdx = q.answer as number;
        wx.showModal({
          title: '偷瞄一下 🤫',
          content: `偷偷告诉你，答案好像是：${q.options ? q.options[correctIdx] : '无法瞄准'}`,
          showCancel: false
        });
      } else if (q.type === 'multi') {
        const correctIdxs = q.answer as number[];
        const answersStr = correctIdxs.map(idx => q.options ? q.options[idx].slice(0, 2) : '').join(' & ');
        wx.showModal({
          title: '偷瞄一下 🤫',
          content: `这道题有多选，小提示选：${answersStr}`,
          showCancel: false
        });
      } else if (q.type === 'fill') {
        wx.showModal({
          title: '偷瞄一下 🤫',
          content: `这道题填空，答案首字或答案为：${String(q.answer)}`,
          showCancel: false
        });
      }

      this.setData({
        peekCount: 0
      });
    },

    onNext() {
      const nextIndex = this.data.currentIndex + 1;
      if (nextIndex < 10) {
        const nextQ = this.data.questionsList[nextIndex];
        this.setData({
          currentIndex: nextIndex,
          currentQuestion: nextQ,
          fillValue: ''
        }, () => {
          this.renderQuestionOptions();
        });
      } else {
        // Show result
        const score = this.data.score;
        const rankInfo = RANKS.find(r => score >= r.min && score <= r.max) || RANKS[0];

        this.setData({
          state: 'result',
          rankInfo
        });
      }
    }
  }
});
