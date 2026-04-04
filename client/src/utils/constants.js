// At-bat result codes and metadata
export const RESULT_CODES = {
  '1H': { label: '단타', code: '1H', type: 'hit', color: 'hit' },
  '2H': { label: '2루타', code: '2H', type: 'hit', color: 'hit' },
  '3H': { label: '3루타', code: '3H', type: 'hit', color: 'hit' },
  HR: { label: '홈런', code: 'HR', type: 'hit', color: 'hit' },
  GO: { label: '땅볼', code: 'GO', type: 'out', color: 'out' },
  FO: { label: '플라이', code: 'FO', type: 'out', color: 'out' },
  SO: { label: '삼진', code: 'SO', type: 'out', color: 'out' },
  DP: { label: '병살', code: 'DP', type: 'out', color: 'out' },
  BB: { label: '볼넷', code: 'BB', type: 'onBase', color: 'onBase' },
  IBB: { label: '고의4구', code: 'IBB', type: 'onBase', color: 'onBase' },
  HBP: { label: '사구', code: 'HBP', type: 'onBase', color: 'onBase' },
  FC: { label: '야선', code: 'FC', type: 'onBase', color: 'onBase' },
  CI: { label: '포수방해', code: 'CI', type: 'onBase', color: 'onBase' },
  SF: { label: '희생플', code: 'SF', type: 'sacrifice', color: 'sacrifice' },
  SH: { label: '희생번', code: 'SH', type: 'sacrifice', color: 'sacrifice' },
  E: { label: '실책', code: 'E', type: 'onBase', color: 'onBase' },
};

export const RESULT_GROUPS = [
  {
    label: '안타',
    type: 'hit',
    codes: ['1H', '2H', '3H', 'HR'],
  },
  {
    label: '아웃',
    type: 'out',
    codes: ['GO', 'FO', 'SO', 'DP'],
  },
  {
    label: '출루',
    type: 'onBase',
    codes: ['BB', 'IBB', 'HBP', 'FC', 'CI', 'E'],
  },
  {
    label: '희생',
    type: 'sacrifice',
    codes: ['SF', 'SH'],
  },
];

// 타구 유형 (Hit Type)
export const HIT_TYPES = [
  { code: 'GB', label: '땅볼', shortLabel: 'GB', desc: 'Ground Ball' },
  { code: 'LD', label: '라인드라이브', shortLabel: 'LD', desc: 'Line Drive' },
  { code: 'FB', label: '플라이볼', shortLabel: 'FB', desc: 'Fly Ball' },
  { code: 'PU', label: '팝업', shortLabel: 'PU', desc: 'Pop-up' },
];

// 타구 방향 (Hit Direction)
export const HIT_DIRECTIONS = [
  { code: 'LL', label: '좌측선', shortLabel: 'LL' },
  { code: 'LC', label: '좌중간', shortLabel: 'L-C' },
  { code: 'C', label: '중앙', shortLabel: 'C' },
  { code: 'RC', label: '우중간', shortLabel: 'R-C' },
  { code: 'RR', label: '우측선', shortLabel: 'RR' },
  { code: 'P', label: '투수앞', shortLabel: 'P' },
  { code: '1B', label: '1루방향', shortLabel: '1B' },
  { code: '3B', label: '3루방향', shortLabel: '3B' },
];

// 이닝 이벤트 유형 (Inning Event Types)
export const INNING_EVENT_TYPES = {
  SB:  { code: 'SB',  label: '도루',     color: '#1565c0', bg: '#dbeafe' },
  CS:  { code: 'CS',  label: '도루자',   color: '#b71c1c', bg: '#fee2e2' },
  WP:  { code: 'WP',  label: '폭투',     color: '#e65100', bg: '#fff3e0' },
  PB:  { code: 'PB',  label: '포일',     color: '#6a1b9a', bg: '#f3e5f5' },
  BK:  { code: 'BK',  label: '보크',     color: '#1b5e20', bg: '#f0fdf4' },
  E:   { code: 'E',   label: '실책진루', color: '#c62828', bg: '#ffebee' },
  OB:  { code: 'OB',  label: '주루사',   color: '#4e342e', bg: '#efebe9' },
  DI:  { code: 'DI',  label: '무관진루', color: '#37474f', bg: '#eceff1' },
  PK:  { code: 'PK',  label: '견제사',   color: '#880e4f', bg: '#fce4ec' },
};

// 수비 포지션 번호 매핑 (Fielder Position Numbers)
export const FIELDER_POSITIONS = [
  { num: 1, code: 'P',  label: '투수' },
  { num: 2, code: 'C',  label: '포수' },
  { num: 3, code: '1B', label: '1루수' },
  { num: 4, code: '2B', label: '2루수' },
  { num: 5, code: '3B', label: '3루수' },
  { num: 6, code: 'SS', label: '유격수' },
  { num: 7, code: 'LF', label: '좌익수' },
  { num: 8, code: 'CF', label: '중견수' },
  { num: 9, code: 'RF', label: '우익수' },
];

// 어떤 결과 코드에서 타구 유형/방향/수비수 선택을 표시할지
export const RESULT_SHOWS_BATTED_BALL = new Set(['GO', 'FO', 'DP', 'SF', '1H', '2H', '3H', 'HR', 'FC', 'E']);
export const RESULT_SHOWS_FIELDERS = new Set(['GO', 'FO', 'DP', 'SF', 'SH', 'FC', 'E']);

export const POSITIONS = [
  { code: 'P', label: '투수' },
  { code: 'C', label: '포수' },
  { code: '1B', label: '1루수' },
  { code: '2B', label: '2루수' },
  { code: '3B', label: '3루수' },
  { code: 'SS', label: '유격수' },
  { code: 'LF', label: '좌익수' },
  { code: 'CF', label: '중견수' },
  { code: 'RF', label: '우익수' },
  { code: 'DH', label: '지명타자' },
];

export const POSITION_MAP = Object.fromEntries(
  POSITIONS.map((p) => [p.code, p.label])
);

export const BATTING_HAND_MAP = {
  L: '좌타',
  R: '우타',
  S: '스위치',
};

export const THROWING_HAND_MAP = {
  L: '좌투',
  R: '우투',
};

export const RESULT_TYPE_COLORS = {
  hit: { bg: '#f0fdf4', text: '#1b5e20', border: '#4c8c4a' },
  out: { bg: '#fff1f2', text: '#b71c1c', border: '#e05252' },
  onBase: { bg: '#eff6ff', text: '#003c8f', border: '#4f83cc' },
  sacrifice: { bg: '#f8fafc', text: '#334155', border: '#94a3b8' },
};

export const GAME_STATUS_MAP = {
  scheduled: '예정',
  in_progress: '진행중',
  final: '종료',
};

export const RESULT_LABEL_MAP = {
  W: '승',
  L: '패',
  D: '무',
};
