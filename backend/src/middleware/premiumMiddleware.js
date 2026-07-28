const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify latest premiumAccess directly from MongoDB
    const freshUser = await User.findById(req.user._id);
    if (!freshUser || !freshUser.premiumAccess) {
      return res.status(403).json({
        success: false,
        message: 'Premium access required to use this feature.'
      });
    }

    req.user = freshUser;
    next();
  } catch (error) {
    console.error('Premium middleware authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization verification failed'
    });
  }
};
