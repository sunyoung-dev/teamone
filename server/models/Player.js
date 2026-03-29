const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  number: { type: Number, required: true },
  position: { type: String, required: true },
  battingHand: { type: String, required: true },
  throwingHand: { type: String, required: true },
  active: { type: Boolean, default: true },
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

module.exports = mongoose.model('Player', playerSchema);
