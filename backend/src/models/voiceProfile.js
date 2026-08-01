const mongoose = require('mongoose');

const voiceProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  voiceId: {
    type: String,
    required: true,
    index: true,
  },
  voiceName: {
    type: String,
    required: true,
  },
  profileName: {
    type: String,
    required: true,
    trim: true,
  },
  speed: {
    type: Number,
    default: 1.0,
    min: 0.5,
    max: 1.5,
  },
  pitch: {
    type: Number,
    default: 0,
    min: -12,
    max: 12,
  },
  voiceDepth: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  tonePreset: {
    type: String,
    default: 'Natural',
    enum: ['Natural', 'Documentary', 'Cinematic', 'Podcast', 'Radio'],
  },
  emotion: {
    type: String,
    default: 'Neutral',
    enum: ['Neutral', 'Serious', 'Dramatic'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('VoiceProfile', voiceProfileSchema);
