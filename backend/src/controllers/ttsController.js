const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');
const { isCloudinaryConfigured, uploadAudioBuffer } = require('../config/cloudinary');

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

// Convert numeric speed multiplier (e.g., 0.8, 1.0, 1.5) to Edge TTS rate string (e.g., "-20%", "+0%", "+50%")
const getRateString = (speed) => {
  const numSpeed = typeof speed === 'number' ? speed : parseFloat(speed) || 1.0;
  const percent = Math.round((numSpeed - 1.0) * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
};

/**
 * Helper to store generated audio buffer either to Cloudinary (production / cloud configured)
 * or to local filesystem (local dev testing fallback).
 */
const storeAudioBuffer = async (audioBuffer, folder, filename) => {
  const hasCloudinary = isCloudinaryConfigured();

  if (hasCloudinary) {
    try {
      return await uploadAudioBuffer(audioBuffer, folder, filename);
    } catch (cloudErr) {
      console.error('Cloudinary audio upload failed, falling back to local storage:', cloudErr);
    }
  }

  // Local filesystem fallback (used if Cloudinary is unconfigured or upload fails)
  try {
    const relativeDir = folder === 'tts-previews' ? '../../public/audio/previews' : '../../public/uploads';
    const uploadsDir = path.join(__dirname, relativeDir);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const outputPath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(outputPath, audioBuffer);

    const urlPrefix = folder === 'tts-previews' ? '/audio/previews/' : '/uploads/';
    return `${urlPrefix}${filename}`;
  } catch (fsErr) {
    console.error('Local audio file storage failed:', fsErr);
    throw new Error('STORAGE_UNAVAILABLE');
  }
};

exports.generateSpeech = async (req, res) => {
  const { text, voice, speed = 1.0 } = req.body;
  const user = req.user;

  console.log('Generate speech request received:', { textLength: text?.length, voice, speed });

  if (!text || !voice) {
    return res.status(400).json({ success: false, message: 'Text and voice are required' });
  }

  const characterCount = text.length;
  const creditsNeeded = Math.max(1, Math.ceil(characterCount / 50));

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
    const filename = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const rateStr = getRateString(speed);

    console.log('Generating voice:', voice, 'with rate:', rateStr);

    const communicate = new CommClass(text, {
      voice: voice,
      rate: rateStr
    });

    const audioChunks = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('No audio data received from Edge TTS service');
    }

    const audioBuffer = Buffer.concat(audioChunks);
    const audioUrl = await storeAudioBuffer(audioBuffer, 'tts-uploads', filename);

    if (!user.premiumAccess) {
      user.usedCredits += creditsNeeded;
      await user.save();
    }

    const historyEntry = new AudioHistory({
      userId: user._id,
      text,
      voice,
      voiceId: voice,
      speed,
      audioUrl,
      characterCount
    });
    await historyEntry.save();

    return res.status(200).json({
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
    if (error.message === 'STORAGE_UNAVAILABLE' || error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        message: 'Unable to store generated audio'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Speech generation failed: ' + error.message
    });
  }
};

// Dedicated Voice Preview Controller
exports.previewSpeech = async (req, res) => {
  const targetVoiceId = req.body.voiceId || req.body.voice;
  const previewText = req.body.text || 'Hi, I am this voice. This is a preview of my narration style.';

  console.log('Preview request:', req.body);

  if (!targetVoiceId) {
    return res.status(400).json({ success: false, message: 'voiceId is required for preview' });
  }

  try {
    const CommClass = await getCommunicateClass();
    const safeVoiceId = targetVoiceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `preview-${safeVoiceId}.mp3`;

    console.log('Generating voice preview for:', targetVoiceId);

    const communicate = new CommClass(previewText, {
      voice: targetVoiceId,
      rate: '+0%'
    });

    const audioChunks = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('No audio data received from Edge TTS service');
    }

    const audioBuffer = Buffer.concat(audioChunks);
    const audioUrl = await storeAudioBuffer(audioBuffer, 'tts-previews', filename);

    console.log('Voice preview generated successfully:', audioUrl);

    return res.status(200).json({
      success: true,
      audioUrl
    });

  } catch (error) {
    console.error('Preview Generation Error:', error);
    if (error.message === 'STORAGE_UNAVAILABLE' || error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        message: 'Unable to store generated audio'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Preview generation failed: ' + error.message
    });
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

exports.deleteHistoryItem = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await AudioHistory.findOne({ _id: id, userId: req.user._id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'History item not found' });
    }

    if (item.audioUrl && item.audioUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../public', item.audioUrl);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete audio file:', err);
        });
      }
    }

    await AudioHistory.deleteOne({ _id: id, userId: req.user._id });
    res.status(200).json({ success: true, message: 'History item deleted' });
  } catch (error) {
    console.error('Delete history item error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete history item' });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    const items = await AudioHistory.find({ userId: req.user._id });
    for (const item of items) {
      if (item.audioUrl && item.audioUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../public', item.audioUrl);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete audio file:', err);
          });
        }
      }
    }
    await AudioHistory.deleteMany({ userId: req.user._id });
    res.status(200).json({ success: true, message: 'Audio history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
};
