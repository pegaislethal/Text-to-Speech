const mongoose = require('mongoose');

const audioHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  voice: { type: String },
  voiceId: { type: String },
  speed: { type: Number, default: 1.0 },
  audioUrl: { type: String, required: true },
  characterCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AudioHistory', audioHistorySchema);
