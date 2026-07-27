const Voice = require('../models/voice');
const voiceCloningService = require('../services/voice-cloning');

/**
 * POST /api/voice/clone
 * Clones a voice from a Base64-encoded audio sample
 */
exports.cloneVoice = async (req, res) => {
  try {
    const { voiceName, audioUrl, consent } = req.body;
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

    // Process Voice Clone
    const cloneResult = await voiceCloningService.cloneVoice(
      user._id, 
      voiceName.trim(), 
      audioUrl
    );

    if (!cloneResult.success) {
      throw new Error('Voice cloning processing failed.');
    }

    // Save Voice Profile to DB
    const voiceProfile = new Voice({
      userId: user._id,
      name: voiceName.trim(),
      voiceName: voiceName.trim(),
      type: 'custom',
      provider: cloneResult.provider,
      sampleUrl: audioUrl,
      sampleAudioUrl: audioUrl,
      embeddingUrl: cloneResult.embeddingUrl,
      status: 'completed',
      settings: cloneResult.settings,
      modelProvider: cloneResult.provider,
      voiceEmbedding: cloneResult.embeddingUrl,
      sampleFiles: [audioUrl]
    });

    await voiceProfile.save();

    res.status(200).json({
      success: true,
      message: 'AI Voice profile created successfully',
      voice: voiceProfile
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
 * GET /api/voice/library
 * Retrieves all platform voices (both custom and default default categories)
 */
exports.getVoiceLibrary = async (req, res) => {
  try {
    const user = req.user;

    // Fetch active system default voices
    const systemVoices = await Voice.find({ type: 'default', isActive: true });

    // Fetch custom voices owned by the current user
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

    // Ownership check (Users can only delete their own cloned voices)
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
