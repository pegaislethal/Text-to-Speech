const VoiceProfile = require('../models/voiceProfile');
const User = require('../models/user');

// Create new Voice Profile
exports.createProfile = async (req, res) => {
  try {
    const { voiceId, voiceName, profileName, speed, pitch, voiceDepth, tonePreset, emotion } = req.body;
    const userId = req.user._id;

    if (!voiceId || !voiceName || !profileName) {
      return res.status(400).json({
        success: false,
        message: 'voiceId, voiceName, and profileName are required',
      });
    }

    // Check free user limit (Free users can save max 1 profile unless premium)
    const userDoc = await User.findById(userId);
    if (!userDoc.premiumAccess) {
      const existingCount = await VoiceProfile.countDocuments({ userId });
      if (existingCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Free plan is limited to 1 saved Voice Profile. Upgrade to Premium to save unlimited profiles.',
        });
      }
    }

    // Sanitize parameters
    const sanitizedSpeed = speed !== undefined ? Math.min(Math.max(parseFloat(speed), 0.5), 1.5) : 1.0;
    const sanitizedPitch = pitch !== undefined ? Math.min(Math.max(parseInt(pitch), -12), 12) : 0;
    const sanitizedDepth = voiceDepth !== undefined ? Math.min(Math.max(parseInt(voiceDepth), 0), 100) : 50;
    const validTones = ['Natural', 'Documentary', 'Cinematic', 'Podcast', 'Radio'];
    const sanitizedTone = validTones.includes(tonePreset) ? tonePreset : 'Natural';
    const validEmotions = ['Neutral', 'Serious', 'Dramatic'];
    const sanitizedEmotion = validEmotions.includes(emotion) ? emotion : 'Neutral';

    const profile = new VoiceProfile({
      userId,
      voiceId,
      voiceName,
      profileName: profileName.trim(),
      speed: sanitizedSpeed,
      pitch: sanitizedPitch,
      voiceDepth: sanitizedDepth,
      tonePreset: sanitizedTone,
      emotion: sanitizedEmotion,
    });

    await profile.save();

    return res.status(201).json({
      success: true,
      message: 'Voice profile saved successfully',
      profile,
    });
  } catch (error) {
    console.error('Error creating voice profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save voice profile',
    });
  }
};

// Get User's Voice Profiles
exports.getProfiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const { voiceId } = req.query;

    const query = { userId };
    if (voiceId) {
      query.voiceId = voiceId;
    }

    const profiles = await VoiceProfile.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      profiles,
    });
  } catch (error) {
    console.error('Error fetching voice profiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch voice profiles',
    });
  }
};

// Update Voice Profile
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { profileName, speed, pitch, voiceDepth, tonePreset, emotion } = req.body;

    const profile = await VoiceProfile.findOne({ _id: id, userId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Voice profile not found',
      });
    }

    if (profileName) profile.profileName = profileName.trim();
    if (speed !== undefined) profile.speed = Math.min(Math.max(parseFloat(speed), 0.5), 1.5);
    if (pitch !== undefined) profile.pitch = Math.min(Math.max(parseInt(pitch), -12), 12);
    if (voiceDepth !== undefined) profile.voiceDepth = Math.min(Math.max(parseInt(voiceDepth), 0), 100);
    if (tonePreset) {
      const validTones = ['Natural', 'Documentary', 'Cinematic', 'Podcast', 'Radio'];
      if (validTones.includes(tonePreset)) profile.tonePreset = tonePreset;
    }
    if (emotion) {
      const validEmotions = ['Neutral', 'Serious', 'Dramatic'];
      if (validEmotions.includes(emotion)) profile.emotion = emotion;
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Voice profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Error updating voice profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update voice profile',
    });
  }
};

// Delete Voice Profile
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await VoiceProfile.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Voice profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Voice profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting voice profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete voice profile',
    });
  }
};
