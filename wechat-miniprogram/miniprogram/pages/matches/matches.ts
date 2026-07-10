import { matches } from '../../data/matches';
const matchesData = matches;

interface Match {
  period: string;
  tournament: string;
  level: string;
  event: string;
  date: string | null;
  dateSort: string;
  round: string;
  partner: string | null;
  assoc: string;
  opponent: string;
  result: string;
  score: string;
  games: string;
}

Component({
  data: {
    opponents: [] as string[],
    periods: [] as string[],
    levels: [] as string[],
    partners: [] as string[],
    results: ['全部胜负', '胜', '负'],

    opponentIndex: 0,
    periodIndex: 0,
    levelIndex: 0,
    partnerIndex: 0,
    resultIndex: 0,

    filteredMatches: [] as Match[],
    visibleMatches: [] as Match[],
    filteredTotal: 0,
    filteredWins: 0,
    filteredLosses: 0,
    filteredWinRate: '0.0',

    page: 1,
    pageSize: 20,
    hasMore: true,
    hasActiveFilters: false
  },

  lifetimes: {
    attached() {
      this.initFilters();
      this.applyFilters();
    }
  },

  methods: {
    onReachBottom() {
      if (this.data.hasMore) {
        this.loadNextPage();
      }
    },

    initFilters() {
      const data = matchesData as Match[];

      const rawOpponents = [...new Set(data.map(m => m.opponent).filter(o => o && o !== '——'))].sort();
      const opponents = ['全部对手', ...rawOpponents];

      const rawPeriods = [...new Set(data.map(m => m.period))].filter(Boolean);
      const periods = ['全部时期', ...rawPeriods];

      const rawLevels = [...new Set(data.map(m => m.level))].filter(Boolean);
      const levels = ['全部级别', ...rawLevels];

      const rawPartners = [...new Set(data.map(m => m.partner).filter((p): p is string => !!p && p !== '——'))].sort();
      const partners = ['全部搭档', ...rawPartners];

      this.setData({
        opponents,
        periods,
        levels,
        partners
      });
    },

    onOpponentChange(e: any) {
      this.setData({ opponentIndex: parseInt(e.detail.value), page: 1 }, () => {
        this.applyFilters();
      });
    },

    onPeriodChange(e: any) {
      this.setData({ periodIndex: parseInt(e.detail.value), page: 1 }, () => {
        this.applyFilters();
      });
    },

    onLevelChange(e: any) {
      this.setData({ levelIndex: parseInt(e.detail.value), page: 1 }, () => {
        this.applyFilters();
      });
    },

    onPartnerChange(e: any) {
      this.setData({ partnerIndex: parseInt(e.detail.value), page: 1 }, () => {
        this.applyFilters();
      });
    },

    onResultChange(e: any) {
      this.setData({ resultIndex: parseInt(e.detail.value), page: 1 }, () => {
        this.applyFilters();
      });
    },

    resetFilters() {
      this.setData({
        opponentIndex: 0,
        periodIndex: 0,
        levelIndex: 0,
        partnerIndex: 0,
        resultIndex: 0,
        page: 1
      }, () => {
        this.applyFilters();
      });
    },

    applyFilters() {
      const data = matchesData as Match[];

      const opponentFilter = this.data.opponentIndex > 0 ? this.data.opponents[this.data.opponentIndex] : null;
      const periodFilter = this.data.periodIndex > 0 ? this.data.periods[this.data.periodIndex] : null;
      const levelFilter = this.data.levelIndex > 0 ? this.data.levels[this.data.levelIndex] : null;
      const partnerFilter = this.data.partnerIndex > 0 ? this.data.partners[this.data.partnerIndex] : null;
      const resultFilter = this.data.resultIndex > 0 ? this.data.results[this.data.resultIndex] : null;

      const hasActiveFilters = !!(opponentFilter || periodFilter || levelFilter || partnerFilter || resultFilter);

      const filtered = data.filter(m => {
        if (opponentFilter && m.opponent !== opponentFilter) return false;
        if (periodFilter && m.period !== periodFilter) return false;
        if (levelFilter && m.level !== levelFilter) return false;
        if (partnerFilter && m.partner !== partnerFilter) return false;
        if (resultFilter && m.result !== resultFilter) return false;
        return true;
      });

      // Calculate statistics
      const total = filtered.length;
      const wins = filtered.filter(m => m.result === '胜').length;
      const losses = filtered.filter(m => m.result === '负').length;
      const winRate = (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

      const visibleMatches = filtered.slice(0, this.data.pageSize);
      const hasMore = filtered.length > this.data.pageSize;

      this.setData({
        filteredMatches: filtered,
        visibleMatches,
        filteredTotal: total,
        filteredWins: wins,
        filteredLosses: losses,
        filteredWinRate: winRate,
        hasMore,
        hasActiveFilters
      });
    },

    loadNextPage() {
      const nextPage = this.data.page + 1;
      const start = (nextPage - 1) * this.data.pageSize;
      const end = nextPage * this.data.pageSize;
      const newBatch = this.data.filteredMatches.slice(start, end);

      const visibleMatches = [...this.data.visibleMatches, ...newBatch];
      const hasMore = this.data.filteredMatches.length > end;

      this.setData({
        visibleMatches,
        page: nextPage,
        hasMore
      });
    },
    onShareAppMessage() {
      return {
        title: '战绩查询 · 樊振东的互联网档案馆',
        path: '/pages/matches/matches'
      };
    },
    onShareTimeline() {
      return {
        title: '战绩查询 · 樊振东的互联网档案馆'
      };
    }
  }
});
