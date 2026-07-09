const mongoose = require('mongoose');

const audioHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  voice: { type: String, required: true },
  audioUrl: { type: String, required: true },
  characterCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AudioHistory', audioHistorySchema);
