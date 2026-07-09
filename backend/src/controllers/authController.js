const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { credential, bypass = false, mockUser = null } = req.body;

  try {
    let email, name, picture, googleId;

    // Use bypass/mock if Google Client ID is not configured or bypass/mock is explicitly requested
    if (bypass || !process.env.GOOGLE_CLIENT_ID || (credential && credential.startsWith('mock_'))) {
      if (mockUser) {
        email = mockUser.email;
        name = mockUser.name;
        picture = mockUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
        googleId = mockUser.googleId || `mock_${email}`;
      } else {
        email = 'testuser@example.com';
        name = 'Test User';
        picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
        googleId = 'mock_testuser';
      }
    } else {
      // Real Google OAuth Verification
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // If this is the very first user in the DB, make them Admin. Otherwise User.
      const userCount = await User.countDocuments();
      const role = userCount === 0 ? 'admin' : 'user';

      user = new User({
        name,
        email,
        profileImage: picture,
        googleId,
        role,
        isActive: true,
        freeCredits: 100, // 100 default characters/credits
        usedCredits: 0
      });
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is deactivated. Contact admin.' });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(400).json({ success: false, message: 'Authentication failed: ' + error.message });
  }
};
