const mongoose = require('mongoose');

const presetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  presetName: { type: String, required: true },
  voiceId: { type: String, required: true },
  speed: { type: Number, default: 1.0 },
  settings: { type: Object, default: {} }
}, {
  timestamps: true
});

module.exports = mongoose.model('Preset', presetSchema);
