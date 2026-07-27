const mongoose = require('mongoose');

const voiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voiceName: { type: String, required: true },
  type: { type: String, enum: ['default', 'custom'], default: 'custom' },
  provider: { type: String, required: true }, // e.g. "XTTS", "OpenVoice", "ElevenLabs"
  sampleUrl: { type: String, required: true },
  embeddingUrl: { type: String }, // Storage URL/location of voice embeddings
  settings: { type: Object, default: {} }
}, {
  timestamps: true
});

module.exports = mongoose.model('Voice', voiceSchema);
