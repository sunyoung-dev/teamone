const mongoose = require('mongoose');

const lineupEntrySchema = new mongoose.Schema({
  playerId: String,
  battingOrder: Number,
  position: String,
}, { _id: false });

const opponentLineupEntrySchema = new mongoose.Schema({
  id: String,
  order: Number,
  name: String,
  number: String,
  position: String,
}, { _id: false });

const runnerEventSchema = new mongoose.Schema({
  runnerName: { type: String, required: true },
  fromBase:   { type: Number, required: true }, // 1, 2, 3
  toBase:     { type: Number, required: true }, // 0=아웃, 1, 2, 3, 4=홈인
}, { _id: false });

const atBatSchema = new mongoose.Schema({
  id: String,
  inning: Number,
  playerId: String,
  result: String,
  order: Number,
  run: { type: Number, default: 0 },
  rbi: { type: Number, default: 0 },
  note: { type: String, default: '' },
  balls:   { type: Number, default: null },
  strikes: { type: Number, default: null },
  fouls:   { type: Number, default: 0 },
  pitches: { type: Number, default: null },
  // 기록원 확장 필드
  hitType:      { type: String, default: null }, // 'GB'|'LD'|'FB'|'PU' (타구 유형)
  hitDirection: { type: String, default: null }, // 'LL'|'LC'|'C'|'RC'|'RR'|'P'|'1B'|'3B' (타구 방향)
  fielders:     { type: [Number], default: [] },  // 관여 수비수 포지션 번호 [1-9]
  isEarnedRun:  { type: Boolean, default: null }, // 자책점 여부
  runnerEvents: [runnerEventSchema],
}, { _id: false });

// 이닝 이벤트 스키마 (도루/폭투/포일/보크 등 타석 외 사건)
const inningEventSchema = new mongoose.Schema({
  id: String,
  inning: Number,
  type: { type: String, required: true }, // 'SB'|'CS'|'WP'|'PB'|'BK'|'E'|'OB'|'DI'|'PK'
  runnerId:    { type: String, default: null }, // 주자 선수 ID (통계 집계용)
  runnerName:  { type: String, default: '' },  // 관련 주자 이름
  pitcherId:   { type: String, default: null }, // 관련 투수 ID (WP/BK/PB)
  fielderPos:  { type: Number, default: null }, // 관련 수비 포지션 번호 (E)
  fromBase:    { type: Number, default: null }, // 이전 루 (1~3)
  toBase:      { type: Number, default: null }, // 이후 루 (0=아웃, 1~3, 4=홈)
  note:        { type: String, default: '' },
}, { _id: false });

const opponentAtBatSchema = new mongoose.Schema({
  id: String,
  batterOrder: Number,
  batterName: String,
  inning: Number,
  result: String,
  rbi: { type: Number, default: 0 },
  run: { type: Number, default: 0 },
  pitcherId: String,
  note: { type: String, default: '' },
  balls:   { type: Number, default: null },
  strikes: { type: Number, default: null },
  fouls:   { type: Number, default: 0 },
  pitches: { type: Number, default: null },
}, { _id: false });

const pitchingSchema = new mongoose.Schema({
  id: String,
  pitcherId: String,
  startInning: Number,
  endInning: Number,
  pitchCount: { type: Number, default: 0 },
  // 투수 결과 기록
  win:        { type: Boolean, default: false }, // 승
  loss:       { type: Boolean, default: false }, // 패
  save:       { type: Boolean, default: false }, // 세이브
  hold:       { type: Boolean, default: false }, // 홀드
  earnedRuns: { type: Number, default: null },   // 자책점 (null=미기록)
}, { _id: false });

const substitutionSchema = new mongoose.Schema({
  id: String,
  inning: Number,
  outPlayerId: { type: String, default: null },
  outPlayerName: { type: String, default: null },
  inPlayerId: { type: String, default: null },
  inPlayerName: { type: String, default: null },
  battingOrder: Number,
  position: String,
  isOpponent: { type: Boolean, default: false },
}, { _id: false });

const gameSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  date: { type: String, required: true },
  opponent: { type: String, required: true },
  venue: { type: String, default: '' },
  result: { type: String, default: null },
  scoreOurs: { type: Number, default: 0 },
  scoreTheirs: { type: Number, default: 0 },
  innings: { type: Number, default: 7 },
  status: { type: String, default: 'scheduled' },
  leagueId: { type: String, default: null },
  round: { type: String, default: '' },
  lineup: [lineupEntrySchema],
  opponentLineup: [opponentLineupEntrySchema],
  atBats: [atBatSchema],
  opponentAtBats: [opponentAtBatSchema],
  pitching: [pitchingSchema],
  substitutions: [substitutionSchema],
  inningEvents: [inningEventSchema],
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

module.exports = mongoose.model('Game', gameSchema);
