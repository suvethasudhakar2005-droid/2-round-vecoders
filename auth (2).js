const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  isStarted: { type: Boolean, default: false },
  isEnded: { type: Boolean, default: false },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 600 } // 10 minutes in seconds
});

module.exports = mongoose.model('Event', eventSchema);
