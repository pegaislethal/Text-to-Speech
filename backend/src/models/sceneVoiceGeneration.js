const mongoose = require('mongoose');

const sceneVoiceGenerationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalScript: {
    type: String,
    required: true
  },
  scenes: [
    {
      sceneNumber: {
        type: Number,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      audioUrl: {
        type: String,
        required: true
      },
      filename: {
        type: String,
        required: true
      }
    }
  ],
  voiceId: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 1.0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SceneVoiceGeneration', sceneVoiceGenerationSchema);
