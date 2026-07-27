const mongoose = require('mongoose');

const voiceSchema = new mongoose.Schema({
  name: { type: String },
  voiceName: { type: String },
  voiceId: { type: String, unique: true, sparse: true },
  provider: { type: String, required: true, default: 'XTTS' },
  category: { type: String },
  description: { type: String },
  previewUrl: { type: String },
  previewAvailable: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  type: { type: String, enum: ['default', 'custom'], default: 'custom' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sampleUrl: { type: String },
  sampleAudioUrl: { type: String },
  embeddingUrl: { type: String },
  speakerEmbedding: { type: String },
  modelPath: { type: String },
  trainingStatus: { 
    type: String, 
    enum: ['uploaded', 'processing', 'training', 'completed', 'failed'], 
    default: 'uploaded' 
  },
  trainingProgress: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  settings: { type: Object, default: {} },
  modelProvider: { type: String, default: 'XTTS' },
  voiceEmbedding: { type: String },
  sampleFiles: [{ type: String }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Voice', voiceSchema);
