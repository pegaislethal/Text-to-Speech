const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden. Administrator privileges required.' });
};

const requireAdminLevel = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'sub_admin')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

const requireAdminOrSubAdmin = requireAdminLevel;

module.exports = {
  adminMiddleware: requireAdmin,
  requireAdmin,
  requireAdminLevel,
  requireAdminOrSubAdmin
};


