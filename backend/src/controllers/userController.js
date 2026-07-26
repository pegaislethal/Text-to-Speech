const User = require('../models/user');
const { isCloudinaryConfigured, uploadImageBuffer } = require('../config/cloudinary');

/**
  GET /api/user/profile
 Returns logged-in user profile details
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const profileImageUrl = user.profileImageUrl || user.profileImage || null;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl,
        profileImage: profileImageUrl,
        bio: user.bio || '',
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Unable to retrieve user profile.' });
  }
};

/**
  PUT /api/user/profile
 Updates name and bio for the logged-in user
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    user.name = name.trim();
    if (typeof bio === 'string') {
      user.bio = bio.trim();
    }

    await user.save();

    const profileImageUrl = user.profileImageUrl || user.profileImage || null;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl,
        profileImage: profileImageUrl,
        bio: user.bio,
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Unable to update profile.' });
  }
};

/**
  POST /api/user/profile/image
 Uploads custom profile image to Cloudinary and saves URL in MongoDB
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided.' });
    }

    // Format Validation: JPG, PNG, WEBP
    const validFormatsRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
    const isDataUri = typeof image === 'string' && image.startsWith('data:image/');

    if (isDataUri && !validFormatsRegex.test(image)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload JPG, PNG, or WEBP image.'
      });
    }

    // Size Validation (5MB max)
    if (isDataUri) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const approxSizeBytes = (base64Data.length * 3) / 4;
      const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

      if (approxSizeBytes > MAX_SIZE_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'Image size must be below 5MB.'
        });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    let secureUrl;

    if (isCloudinaryConfigured()) {
      const filename = `profile-${user._id}-${Date.now()}`;
      secureUrl = await uploadImageBuffer(image, 'user-profiles', filename);
    } else {
      // Fallback if Cloudinary is not configured in local environment
      secureUrl = image;
    }

    user.profileImageUrl = secureUrl;
    user.profileImage = secureUrl; // Maintain backwards compatibility
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      profileImageUrl: secureUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: secureUrl,
        profileImage: secureUrl,
        bio: user.bio,
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update profile image. ' + (error.message || '')
    });
  }
};

/**
  DELETE /api/user/profile/image
 Removes custom profile image
 */
exports.removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    user.profileImageUrl = null;
    user.profileImage = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image removed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: null,
        profileImage: null,
        bio: user.bio,
        role: user.role,
        premiumAccess: user.premiumAccess,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Remove profile image error:', error);
    res.status(500).json({ success: false, message: 'Unable to remove profile image.' });
  }
};
