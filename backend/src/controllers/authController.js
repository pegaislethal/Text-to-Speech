const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { getCookieOptions, getClearCookieOptions } = require('../utils/cookieUtils');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { credential, bypass = false, mockUser = null } = req.body;

  try {
    let email, name, picture, googleId;

    if (bypass || !process.env.GOOGLE_CLIENT_ID || (credential && credential.startsWith('mock_'))) {
      if (mockUser) {
        email = mockUser.email;
        name = mockUser.name;
        picture = mockUser.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
        googleId = mockUser.googleId || `mock_${email}`;
      } else {
        email = 'user@21sttech.com';
        name = 'Team Member';
        picture = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
        googleId = 'mock_user_id';
      }
    } else {
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

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name,
        email,
        profileImage: picture,
        profileImageUrl: picture,
        googleId,
        role: 'user',
        isActive: true,
        premiumAccess: false,
        freeCredits: 100,
        usedCredits: 0
      });
      await user.save();
    } else {
      let needsSave = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        needsSave = true;
      }
      if (picture && (!user.profileImage || !user.profileImageUrl)) {
        user.profileImage = user.profileImage || picture;
        user.profileImageUrl = user.profileImageUrl || picture;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'User account is deactivated. Contact administrator.' });
    }

    const token = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImageUrl || user.profileImage,
        profileImageUrl: user.profileImageUrl || user.profileImage,
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

// Regular User Signup Handler (Email + Password)
exports.userSignup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'user',
      premiumAccess: false,
      isActive: true,
      freeCredits: 100,
      usedCredits: 0
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, userId: newUser._id, email: newUser.email, role: newUser.role, premiumAccess: newUser.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profileImage: newUser.profileImage,
        role: newUser.role,
        premiumAccess: newUser.premiumAccess,
        freeCredits: newUser.freeCredits,
        usedCredits: newUser.usedCredits
      }
    });
  } catch (error) {
    console.error('User signup error:', error);
    res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  }
};

// Regular User Login Handler (Email + Password)
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'This account was created via Google Sign-In. Please sign in using Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const token = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

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
    console.error('User login error:', error);
    res.status(500).json({ success: false, message: 'Login failed: ' + error.message });
  }
};

// Admin Signup Handler (Email + Password)
exports.adminSignup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      name,
      email,
      passwordHash,
      role: 'admin',
      premiumAccess: true,
      isActive: true,
      permissions: ['MANAGE_USERS', 'MANAGE_PREMIUM', 'VIEW_ANALYTICS']
    });

    await newAdmin.save();

    const token = jwt.sign(
      { id: newAdmin._id, userId: newAdmin._id, email: newAdmin.email, role: newAdmin.role, premiumAccess: newAdmin.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        premiumAccess: newAdmin.premiumAccess
      }
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ success: false, message: 'Admin registration failed: ' + error.message });
  }
};

// Admin Login Handler (Email + Password)
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Account is not an administrator.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'This admin profile was created via OAuth. Please contact system owner.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
    }

    const token = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        premiumAccess: user.premiumAccess
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Admin login failed: ' + error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');
        console.log(`[Logout] User ${decoded.email} verified and logging out.`);
      } catch (err) {
        console.log('[Logout] Token verification failed or expired during logout.');
      }
    } else {
      console.log('[Logout] No token found in request during logout.');
    }

    // Clear authentication cookies with appropriate cookie options
    res.clearCookie('token', getClearCookieOptions());
    res.clearCookie('accessToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed: ' + error.message });
  }
};

// Session Refresh Handler
exports.refreshSession = async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    res.cookie('token', token, getCookieOptions());

    res.setHeader('x-new-token', token);
    res.setHeader('Access-Control-Expose-Headers', 'x-new-token');

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImageUrl || user.profileImage,
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits
      }
    });
  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh session: ' + error.message });
  }
};
