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

const atBatSchema = new mongoose.Schema({
  id: String,
  inning: Number,
  playerId: String,
  result: String,
  order: Number,
  run: { type: Number, default: 0 },
  rbi: { type: Number, default: 0 },
  note: { type: String, default: '' },
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
}, { _id: false });

const pitchingSchema = new mongoose.Schema({
  id: String,
  pitcherId: String,
  startInning: Number,
  endInning: Number,
  pitchCount: { type: Number, default: 0 },
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
  lineup: [lineupEntrySchema],
  opponentLineup: [opponentLineupEntrySchema],
  atBats: [atBatSchema],
  opponentAtBats: [opponentAtBatSchema],
  pitching: [pitchingSchema],
  substitutions: [substitutionSchema],
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
