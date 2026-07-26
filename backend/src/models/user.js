const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // For admin email/password authentication
  profileImage: { type: String },
  profileImageUrl: { type: String },
  bio: { type: String, default: '' },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  premiumAccess: { type: Boolean, default: false },
  freeCredits: { type: Number, default: 100 },
  usedCredits: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
