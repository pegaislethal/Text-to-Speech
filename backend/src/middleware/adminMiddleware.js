const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden. Administrator privileges required.' });
  }
};

const requireAdminOrSubAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'sub_admin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden. Administrator or Sub-Admin privileges required.' });
  }
};

module.exports = {
  adminMiddleware: requireAdmin,
  requireAdmin,
  requireAdminOrSubAdmin
};

