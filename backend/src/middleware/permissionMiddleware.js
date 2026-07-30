/**
 * Role-Based Access Control (RBAC) Permission Middleware
 * Enforces server-side permissions for admin operations.
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this page.' });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = req.user.role === 'admin' || userPermissions.includes('all') || userPermissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden. Required permission missing: ${requiredPermission}` 
      });
    }

    next();
  };
};

module.exports = { requirePermission };
