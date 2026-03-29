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
  HBP: { label: '사구', code: 'HBP', type: 'onBase', color: 'onBase' },
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
    codes: ['BB', 'HBP', 'E'],
  },
  {
    label: '희생',
    type: 'sacrifice',
    codes: ['SF', 'SH'],
  },
];

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
  hit: { bg: '#e8f5e9', text: '#1b5e20', border: '#4caf50' },
  out: { bg: '#ffebee', text: '#b71c1c', border: '#ef5350' },
  onBase: { bg: '#e3f2fd', text: '#0d47a1', border: '#42a5f5' },
  sacrifice: { bg: '#f5f5f5', text: '#424242', border: '#9e9e9e' },
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
