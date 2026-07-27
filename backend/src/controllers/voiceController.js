const Voice = require('../models/voice');
const voiceCloningService = require('../services/voice-cloning');

/**
 * POST /api/voice/clone
 * Clones a voice from a Base64-encoded audio sample
 */
exports.cloneVoice = async (req, res) => {
  try {
    const { voiceName, audioData, consent } = req.body;
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

    if (!audioData) {
      return res.status(400).json({ success: false, message: 'No voice sample audio data provided.' });
    }

    // Format Validation: MP3, WAV, M4A
    const validFormatsRegex = /^data:audio\/(mpeg|mp3|wav|m4a|x-m4a|mp4|aac|ogg);base64,/i;
    const isDataUri = typeof audioData === 'string' && audioData.startsWith('data:audio/');

    if (isDataUri && !validFormatsRegex.test(audioData)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a voice sample in MP3, WAV, or M4A format.'
      });
    }

    // Decode base64 to buffer
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Size limit (10MB max)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (audioBuffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'Voice sample file size must be below 10MB.'
      });
    }

    // Process Voice Clone
    const extension = audioData.match(/audio\/(\w+)/)?.[1] || 'mp3';
    const filename = `clone-${user._id}-${Date.now()}.${extension}`;
    
    const cloneResult = await voiceCloningService.cloneVoice(
      user._id, 
      voiceName.trim(), 
      audioBuffer, 
      filename
    );

    if (!cloneResult.success) {
      throw new Error('Voice cloning service processing failed.');
    }

    // Save Voice Profile to DB
    const voiceProfile = new Voice({
      userId: user._id,
      voiceName: voiceName.trim(),
      type: 'custom',
      provider: cloneResult.provider,
      sampleUrl: cloneResult.sampleUrl,
      embeddingUrl: cloneResult.embeddingUrl,
      settings: cloneResult.settings
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
      message: error.message || 'Failed to process voice clone sample.'
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

    // Fetch custom voices owned by the current user
    const customVoices = await Voice.find({ userId: user._id, type: 'custom' });

    res.status(200).json({
      success: true,
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
