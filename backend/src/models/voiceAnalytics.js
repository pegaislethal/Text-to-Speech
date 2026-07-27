const mongoose = require('mongoose');

const voiceAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voiceId: { type: String, required: true },
  voiceName: { type: String },
  provider: { type: String },
  generationCount: { type: Number, default: 1 },
  totalCharacters: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // audio duration in seconds
  isPremium: { type: Boolean, default: false },
  category: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VoiceAnalytics', voiceAnalyticsSchema);
