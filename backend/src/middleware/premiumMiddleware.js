module.exports = (req, res, next) => {
  if (!req.user || !req.user.premiumAccess) {
    return res.status(403).json({
      success: false,
      message: 'This feature is available only for premium users.'
    });
  }
  next();
};
