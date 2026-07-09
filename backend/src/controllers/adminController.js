const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');

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
