const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  season: { type: String, required: true },
  organizer: { type: String, default: '' },
  description: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
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

module.exports = mongoose.model('League', leagueSchema);
