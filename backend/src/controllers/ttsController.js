const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');

let UniversalCommunicate;

// Helper to dynamically import the ESM edge-tts-universal package
const getCommunicateClass = async () => {
  if (!UniversalCommunicate) {
    try {
      const module = await import('edge-tts-universal');
      UniversalCommunicate = module.UniversalCommunicate;
    } catch (error) {
      console.error('Failed to import edge-tts-universal:', error);
      throw new Error('TTS service is currently unavailable');
    }
  }
  return UniversalCommunicate;
};

exports.generateSpeech = async (req, res) => {
  const { text, voice } = req.body;
  const user = req.user;

  if (!text || !voice) {
    return res.status(400).json({ success: false, message: 'Text and voice are required' });
  }

  // Calculate credit cost (e.g., 1 credit per 50 characters, minimum 1)
  const characterCount = text.length;
  const creditsNeeded = Math.max(1, Math.ceil(characterCount / 50));

  // Check credits for non-premium users
  if (!user.premiumAccess) {
    const remainingCredits = user.freeCredits - user.usedCredits;
    if (creditsNeeded > remainingCredits) {
      return res.status(403).json({
        success: false,
        message: 'You have reached your free usage limit. Contact administrator for access.'
      });
    }
  }

  try {
    const CommClass = await getCommunicateClass();
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const outputPath = path.join(uploadsDir, filename);

    // Call Edge TTS
    const communicate = new CommClass(text, voice);
    const audioChunks = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('No audio data received from Edge TTS service');
    }

    // Write to filesystem
    await fs.promises.writeFile(outputPath, Buffer.concat(audioChunks));

    const audioUrl = `/uploads/${filename}`;

    // Update user credits
    if (!user.premiumAccess) {
      user.usedCredits += creditsNeeded;
      await user.save();
    }

    // Save to history
    const historyEntry = new AudioHistory({
      userId: user._id,
      text,
      voice,
      audioUrl,
      characterCount
    });
    await historyEntry.save();

    res.status(200).json({
      success: true,
      audioUrl,
      characterCount,
      creditsUsed: creditsNeeded,
      user: {
        id: user._id,
        freeCredits: user.freeCredits,
        usedCredits: user.usedCredits,
        premiumAccess: user.premiumAccess
      }
    });

  } catch (error) {
    console.error('TTS Generation Error:', error);
    res.status(500).json({ success: false, message: 'Speech generation failed: ' + error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await AudioHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};
