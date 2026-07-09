const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  freeUserLimit: { type: Number, default: 100 }, // Default credit limit for new users
  availableVoices: {
    type: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        lang: { type: String, default: 'en-US' },
        gender: { type: String, enum: ['Male', 'Female'], default: 'Female' },
        premium: { type: Boolean, default: false }
      }
    ],
    default: [
      { id: 'en-US-AvaNeural', name: 'Ava (US)', lang: 'en-US', gender: 'Female', premium: false },
      { id: 'en-US-AndrewNeural', name: 'Andrew (US)', lang: 'en-US', gender: 'Male', premium: false },
      { id: 'en-US-EmmaNeural', name: 'Emma (US)', lang: 'en-US', gender: 'Female', premium: false },
      { id: 'en-US-BrianNeural', name: 'Brian (US)', lang: 'en-US', gender: 'Male', premium: false },
      { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', lang: 'en-GB', gender: 'Female', premium: true },
      { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', lang: 'en-GB', gender: 'Male', premium: true }
    ]
  },
  systemSettings: { type: Map, of: String, default: {} }
});

module.exports = mongoose.model('Settings', settingsSchema);
