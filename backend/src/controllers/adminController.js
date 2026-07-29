const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');
const bcrypt = require('bcryptjs');

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

    if (role) user.role = role;
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

    await User.findByIdAndDelete(id);
    // Remove history for this user
    await AudioHistory.deleteMany({ userId: id });

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

    user.premiumAccess = premiumAccess;
    await user.save();

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

    if (role && ['user', 'admin'].includes(role)) {
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

