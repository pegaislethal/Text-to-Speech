const mongoose = require('mongoose');

const voiceSchema = new mongoose.Schema({
  name: { type: String },
  voiceName: { type: String },
  voiceId: { type: String, unique: true, sparse: true },
  provider: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  previewUrl: { type: String },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['default', 'custom'], default: 'custom' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sampleUrl: { type: String },
  embeddingUrl: { type: String },
  settings: { type: Object, default: {} },
  modelProvider: { type: String },
  voiceEmbedding: { type: String },
  sampleFiles: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Voice', voiceSchema);
