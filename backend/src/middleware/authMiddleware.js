const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Fetch token from cookies (HTTP-only) or fallback to Authorization header
    let token = req.cookies.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Session expired' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');

    // 3. Retrieve user
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Session expired' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact administrator.' });
    }

    req.user = user;

    // 4. Generate new token with refreshed expiration
    const newToken = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    // 5. Update token in cookies (HTTP-only, Lax, Secure in prod)
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 25 * 60 * 1000 // 25 minutes
    });

    // 6. Expose new token to headers for the frontend to update localStorage
    res.setHeader('x-new-token', newToken);
    res.setHeader('Access-Control-Expose-Headers', 'x-new-token');

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
};

module.exports = authMiddleware;
