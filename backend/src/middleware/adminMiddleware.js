const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this page.' });
  }
};

module.exports = adminMiddleware;
