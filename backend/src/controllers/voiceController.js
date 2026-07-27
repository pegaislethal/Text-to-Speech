const Voice = require('../models/voice');
const xttsProvider = require('../services/voice-cloning/providers/xttsProvider');

/**
 * POST /api/voice/clone
 * Trigger AI voice cloning adaptation pipeline for premium users
 */
exports.cloneVoice = async (req, res) => {
  try {
    const { voiceName, audioUrl, consent, provider = 'XTTS' } = req.body;
    const user = req.user;

    // Premium Check
    if (!user || !user.premiumAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'This feature is available for premium users.' 
      });
    }

    // Ownership Consent Check
    if (!consent) {
      return res.status(400).json({
        success: false,
        message: 'You must confirm ownership or authorization for this voice sample.'
      });
    }

    if (!voiceName || !voiceName.trim()) {
      return res.status(400).json({ success: false, message: 'Voice name is required.' });
    }

    if (!audioUrl) {
      return res.status(400).json({ success: false, message: 'Audio URL is required.' });
    }

    // Trigger Python Adaptation Pipeline
    const cloneResult = await xttsProvider.cloneVoice(
      user._id, 
      voiceName.trim(), 
      audioUrl,
      consent
    );

    const generatedVoiceId = cloneResult.voiceId || `voice_${Date.now()}`;

    // Save Voice Profile to DB
    const voiceProfile = new Voice({
      userId: user._id,
      name: voiceName.trim(),
      voiceName: voiceName.trim(),
      voiceId: generatedVoiceId,
      type: 'custom',
      provider: provider,
      modelProvider: provider,
      sampleUrl: audioUrl,
      sampleAudioUrl: audioUrl,
      trainingStatus: cloneResult.trainingStatus || 'processing',
      trainingProgress: cloneResult.trainingProgress || 10,
      status: cloneResult.trainingStatus === 'completed' ? 'completed' : 'processing',
      settings: cloneResult.settings || {},
      sampleFiles: [audioUrl]
    });

    await voiceProfile.save();

    res.status(200).json({
      success: true,
      message: 'AI Voice adaptation pipeline initialized',
      voice: voiceProfile,
      trainingStatus: voiceProfile.trainingStatus,
      trainingProgress: voiceProfile.trainingProgress
    });

  } catch (error) {
    console.error('Clone Voice Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Voice cloning failed. Please try another sample.'
    });
  }
};

/**
 * GET /api/voice/status/:id
 * Fetch live training progress of custom voice model
 */
exports.getTrainingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const voice = await Voice.findById(id);
    if (!voice) {
      return res.status(404).json({ success: false, message: 'Voice profile not found.' });
    }

    // Ownership check
    if (voice.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    // Query status from Python AI service
    const statusData = await xttsProvider.getStatus(voice.voiceId || id);

    if (statusData) {
      voice.trainingStatus = statusData.status === 'completed' ? 'completed' : 'processing';
      voice.trainingProgress = statusData.trainingProgress || (statusData.status === 'completed' ? 100 : voice.trainingProgress);
      if (statusData.status === 'completed') {
        voice.status = 'completed';
      }
      await voice.save();
    }

    res.status(200).json({
      success: true,
      voiceId: voice._id,
      status: voice.status,
      trainingStatus: statusData?.trainingStatus || 'Voice ready.',
      trainingProgress: statusData?.trainingProgress ?? 100,
      error: statusData?.error || null
    });
  } catch (error) {
    console.error('Get Training Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
};

/**
 * GET /api/voice/library
 * Retrieves all platform voices
 */
exports.getVoiceLibrary = async (req, res) => {
  try {
    const user = req.user;
    const systemVoices = await Voice.find({ type: 'default', isActive: true });
    const customVoices = await Voice.find({ userId: user._id, type: 'custom' });

    res.status(200).json({
      success: true,
      systemVoices,
      customVoices
    });
  } catch (error) {
    console.error('Fetch Voice Library Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice profiles.'
    });
  }
};

/**
 * DELETE /api/voice/:id
 * Deletes a custom cloned voice
 */
exports.deleteVoice = async (req, res) => {
  try {
    const voiceId = req.params.id;
    const user = req.user;

    const voice = await Voice.findById(voiceId);
    if (!voice) {
      return res.status(404).json({ success: false, message: 'Voice profile not found.' });
    }

    if (voice.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this voice.' 
      });
    }

    await Voice.findByIdAndDelete(voiceId);

    res.status(200).json({
      success: true,
      message: 'Custom voice profile deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Voice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voice profile.'
    });
  }
};
