const mongoose = require('mongoose');

const passwordResetOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  resetTokenHash: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  attemptCount: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PasswordResetOTP', passwordResetOTPSchema);
