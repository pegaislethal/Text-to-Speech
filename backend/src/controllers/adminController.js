const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');
const AuditLog = require('../models/auditLog');
const bcrypt = require('bcryptjs');

const logAdminAction = async (req, action, targetUser, details) => {
  try {
    await AuditLog.create({
      performedBy: req.user._id,
      performedByName: req.user.name || req.user.email,
      performedByEmail: req.user.email,
      performedByRole: req.user.role,
      action,
      targetUser: targetUser?._id,
      targetUserEmail: targetUser?.email,
      details
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

// Get all users with search
exports.getUsers = async (req, res) => {
  const { search } = req.query;
  try {
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Update user details (activation status, credits, role)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, isActive, freeCredits } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role protection rule: Sub-admin cannot modify admin accounts or assign admin roles
    if (user.role === 'admin' && req.user.role === 'sub_admin') {
      await logAdminAction(
        req,
        'ATTEMPTED_ADMIN_MODIFICATION',
        user,
        `${req.user.name || req.user.email} (sub_admin) attempted unauthorized modification of admin account ${user.email}`
      );
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    if (role) {
      user.role = role;
      await logAdminAction(req, 'CHANGE_USER_ROLE', user, `${req.user.name || req.user.email} changed role of ${user.email} to ${role}`);
    }
    if (isActive !== undefined) user.isActive = isActive;
    if (freeCredits !== undefined) user.freeCredits = freeCredits;

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protection rule: Sub-admin cannot delete admin accounts
    if (user.role === 'admin' && req.user.role === 'sub_admin') {
      await logAdminAction(
        req,
        'ATTEMPTED_ADMIN_DELETION',
        user,
        `${req.user.name || req.user.email} (sub_admin) attempted unauthorized deletion of admin account ${user.email}`
      );
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    await User.findByIdAndDelete(id);
    // Remove history for this user
    await AudioHistory.deleteMany({ userId: id });

    await logAdminAction(req, 'DELETE_USER', user, `${req.user.name || req.user.email} deleted user account ${user.email}`);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// Toggle Premium Access manually
exports.togglePremium = async (req, res) => {
  const { id } = req.params;
  const { premiumAccess } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protection rule: Sub-admin cannot modify admin accounts
    if (user.role === 'admin' && req.user.role === 'sub_admin') {
      await logAdminAction(
        req,
        'ATTEMPTED_ADMIN_MODIFICATION',
        user,
        `${req.user.name || req.user.email} (sub_admin) attempted unauthorized premium update on admin account ${user.email}`
      );
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    user.premiumAccess = premiumAccess;
    await user.save();

    const actionText = premiumAccess ? 'upgraded' : 'removed premium access from';
    const actionType = premiumAccess ? 'GRANT_PREMIUM' : 'REMOVE_PREMIUM';
    await logAdminAction(
      req,
      actionType,
      user,
      `${req.user.name || req.user.email} (${req.user.role}) ${actionText} user ${user.email}`
    );

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Toggle premium error:', error);
    res.status(500).json({ success: false, message: 'Failed to update premium access status' });
  }
};

// Get Admin Stats Dashboard
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const premiumUsers = await User.countDocuments({ premiumAccess: true });
    const totalAudioCount = await AudioHistory.countDocuments();

    // Aggregate statistics
    const audioData = await AudioHistory.aggregate([
      {
        $group: {
          _id: null,
          totalCharacters: { $sum: '$characterCount' }
        }
      }
    ]);
    const totalCharacters = audioData.length > 0 ? audioData[0].totalCharacters : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        premiumUsers,
        totalAudioCount,
        totalCharacters
      }
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats' });
  }
};

// Get system settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// Update system settings
exports.updateSettings = async (req, res) => {
  const { freeUserLimit, availableVoices } = req.body;
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (freeUserLimit !== undefined) settings.freeUserLimit = freeUserLimit;
    if (availableVoices) settings.availableVoices = availableVoices;

    await settings.save();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

// Create a new Administrator (Only callable by an existing Admin)
exports.createAdmin = async (req, res) => {
  const { name, email, password, permissions } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.status(400).json({ success: false, message: 'An administrator with this email already exists' });
      }
      // Upgrade existing user to admin
      const salt = await bcrypt.genSalt(10);
      existingUser.passwordHash = await bcrypt.hash(password, salt);
      existingUser.role = 'admin';
      existingUser.permissions = Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ['MANAGE_USERS', 'MANAGE_PREMIUM', 'VIEW_ANALYTICS', 'MANAGE_ADMINS'];
      existingUser.premiumAccess = true;
      existingUser.isActive = true;
      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: `Existing user ${email} successfully promoted to Administrator.`,
        admin: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          permissions: existingUser.permissions
        }
      });
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
      permissions: Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ['MANAGE_USERS', 'MANAGE_PREMIUM', 'VIEW_ANALYTICS', 'MANAGE_ADMINS']
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'New administrator created successfully',
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        permissions: newAdmin.permissions
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create administrator: ' + error.message });
  }
};

// Update Admin Permissions
exports.updateAdminPermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions, role } = req.body;

  try {
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (permissions && Array.isArray(permissions)) {
      targetUser.permissions = permissions;
    }

    if (role && ['user', 'sub_admin', 'admin'].includes(role)) {
      targetUser.role = role;
    }

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        permissions: targetUser.permissions
      }
    });
  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin permissions' });
  }
};

// Create a new Sub Admin (Callable ONLY by full Admin)
exports.createSubAdmin = async (req, res) => {
  const { name, email, password, status = 'active' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and temporary password are required' });
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

    const subAdmin = new User({
      name,
      email,
      passwordHash,
      role: 'sub_admin',
      isActive: status === 'active',
      premiumAccess: true,
      permissions: ['MANAGE_USERS', 'MANAGE_PREMIUM', 'VIEW_ANALYTICS']
    });

    await subAdmin.save();

    await logAdminAction(
      req,
      'CREATE_SUB_ADMIN',
      subAdmin,
      `${req.user.name || req.user.email} created sub-admin account for ${email}`
    );

    res.status(201).json({
      success: true,
      message: 'Sub-admin account created successfully',
      subAdmin: {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        role: subAdmin.role,
        isActive: subAdmin.isActive,
        createdAt: subAdmin.createdAt
      }
    });
  } catch (error) {
    console.error('Create sub-admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create sub-admin: ' + error.message });
  }
};

// Get list of Sub-Admins
exports.getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: 'sub_admin' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, subAdmins });
  } catch (error) {
    console.error('Fetch sub-admins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sub-admins' });
  }
};

// Update Sub-Admin Active Status (Disable / Enable)
exports.updateSubAdminStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const subAdmin = await User.findOne({ _id: id, role: 'sub_admin' });
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: 'Sub-admin not found' });
    }

    subAdmin.isActive = isActive;
    await subAdmin.save();

    const action = isActive ? 'ENABLE_SUB_ADMIN' : 'DISABLE_SUB_ADMIN';
    await logAdminAction(
      req,
      action,
      subAdmin,
      `${req.user.name || req.user.email} ${isActive ? 'enabled' : 'disabled'} sub-admin ${subAdmin.email}`
    );

    res.status(200).json({ success: true, subAdmin });
  } catch (error) {
    console.error('Update sub-admin status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update sub-admin status' });
  }
};

// Remove Sub-Admin
exports.deleteSubAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const subAdmin = await User.findOne({ _id: id, role: 'sub_admin' });
    if (!subAdmin) {
      return res.status(404).json({ success: false, message: 'Sub-admin not found' });
    }

    await User.findByIdAndDelete(id);

    await logAdminAction(
      req,
      'REMOVE_SUB_ADMIN',
      subAdmin,
      `${req.user.name || req.user.email} removed sub-admin account ${subAdmin.email}`
    );

    res.status(200).json({ success: true, message: 'Sub-admin removed successfully' });
  } catch (error) {
    console.error('Delete sub-admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove sub-admin' });
  }
};

// Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};


