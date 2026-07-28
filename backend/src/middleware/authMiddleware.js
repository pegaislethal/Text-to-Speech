const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { getCookieOptions } = require('../utils/cookieUtils');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Fetch token from cookies (HTTP-only) or fallback to Authorization header
    let token = req.cookies?.token;
    const hasAuthHeader = Boolean(req.headers.authorization && req.headers.authorization.startsWith('Bearer '));

    if (!token && hasAuthHeader) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Debug logging for session inspection
    if (process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(`[Auth Audit] Request: ${req.method} ${req.originalUrl || req.url} | Cookie present: ${Boolean(req.cookies?.token)} | Header present: ${hasAuthHeader}`);
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        code: 'SESSION_EXPIRED', 
        message: 'Session expired' 
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');
    const userId = decoded.id || decoded.userId;

    if (process.env.DEBUG_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
      const expTime = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'none';
      console.log(`[Auth Audit] Decoded User: ${userId} (${decoded.email}) | Role: ${decoded.role} | Exp: ${expTime}`);
    }

    // 3. Retrieve user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        code: 'SESSION_EXPIRED', 
        message: 'Session expired' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        code: 'ACCOUNT_DEACTIVATED', 
        message: 'Your account is deactivated. Contact administrator.' 
      });
    }

    req.user = user;

    // 4. Generate new token with refreshed expiration (25 minutes)
    const newToken = jwt.sign(
      { id: user._id, userId: user._id, email: user.email, role: user.role, premiumAccess: user.premiumAccess },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '25m' }
    );

    // 5. Update token in cookies using cookieUtils
    res.cookie('token', newToken, getCookieOptions());

    // 6. Expose new token to headers for frontend localStorage synchronization
    res.setHeader('x-new-token', newToken);
    res.setHeader('Access-Control-Expose-Headers', 'x-new-token');

    next();
  } catch (error) {
    console.error('[Auth Audit] Token verification error:', error.message);
    return res.status(401).json({ 
      success: false, 
      code: 'SESSION_EXPIRED', 
      message: 'Session expired' 
    });
  }
};

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_123');
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    console.error('Optional auth middleware token verification failed:', error.message);
  }
  next();
};

authMiddleware.optional = optionalAuthMiddleware;

module.exports = authMiddleware;
