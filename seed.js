const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: false },
  sessionToken: { type: String, default: null },
  problemId: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completionTime: { type: Number, default: null }, // seconds from event start
  submissionCount: { type: Number, default: 0 },
  lastSubmitAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
