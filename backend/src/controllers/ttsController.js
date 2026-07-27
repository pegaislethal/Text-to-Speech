const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const AudioHistory = require('../models/audioHistory');
const Settings = require('../models/settings');
const Voice = require('../models/voice');
const VoiceAnalytics = require('../models/voiceAnalytics');
const { isCloudinaryConfigured, uploadAudioBuffer } = require('../config/cloudinary');
const { processAudio, getAudioDuration } = require('../utils/audioProcessor');
const mongoose = require('mongoose');

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

// Clamp speed between 0.5x and 1.5x
const sanitizeSpeed = (speed) => {
  const numSpeed = typeof speed === 'number' ? speed : parseFloat(speed);
  if (isNaN(numSpeed)) return 1.0;
  if (numSpeed > 1.5) return 1.5;
  if (numSpeed < 0.5) return 0.5;
  return numSpeed;
};

// Convert numeric speed multiplier (0.5 to 1.5) to Edge TTS rate string (e.g., "-50%", "+0%", "+50%")
const getRateString = (speed) => {
  const validSpeed = sanitizeSpeed(speed);
  const percent = Math.round((validSpeed - 1.0) * 100);
  return percent >= 0 ? `+${percent}%` : `${percent}%`;
};

/**
 * Helper to store generated audio buffer either to Cloudinary (production / cloud configured)
 * or to local filesystem (local dev testing fallback).
 */
const storeAudioBuffer = async (audioBuffer, folder, filename) => {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio generation returned empty data');
  }

  const hasCloudinary = isCloudinaryConfigured();
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

  if (hasCloudinary) {
    console.log('Uploading audio to Cloudinary...');
    return await uploadAudioBuffer(audioBuffer, folder, filename);
  }

  if (isVercel || process.env.NODE_ENV === 'production') {
    throw new Error(
      'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.'
    );
  }

  // Local filesystem fallback (used only for non-Vercel local development)
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
    throw new Error(`Local file storage failed: ${fsErr.message}`);
  }
};

exports.generateSpeech = async (req, res) => {
  const text = req.body.text || req.body.script;
  const voice = req.body.voice || req.body.voiceId;
  const speed = req.body.speed !== undefined ? req.body.speed : 1.0;
  const pitch = req.body.pitchOffset !== undefined ? req.body.pitchOffset : (req.body.pitch || 0);
  const depth = req.body.voiceDepth !== undefined ? req.body.voiceDepth : (req.body.depth || 0);
  const tone = req.body.eqPreset || req.body.eq || req.body.tone || 'natural';
  const user = req.user;

  console.log('Generate speech request received:', { 
    textLength: text?.length, 
    voice, 
    speed, 
    pitch, 
    tone, 
    depth 
  });

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
    // 1. Resolve Voice Profile and check permissions
    let baseVoiceId = voice;
    let voiceDisplayName = voice;
    let voiceDoc = null;

    if (mongoose.Types.ObjectId.isValid(voice)) {
      // Custom cloned voice profile
      voiceDoc = await Voice.findOne({ _id: voice, userId: user._id });
      if (!voiceDoc) {
        return res.status(404).json({ success: false, message: 'Custom voice profile not found.' });
      }
      
      // Enforce premium check for cloned voices
      if (!user.premiumAccess) {
        return res.status(403).json({ success: false, message: 'Upgrade to Premium to unlock this voice.' });
      }

      baseVoiceId = 'en-US-ChristopherNeural'; // fallback base for cloned voice
      voiceDisplayName = voiceDoc.name || voiceDoc.voiceName;
      console.log(`[TTS] Using custom cloned voice "${voiceDisplayName}" (Base: ${baseVoiceId})`);
    } else {
      // System default voice
      voiceDoc = await Voice.findOne({ voiceId: voice, type: 'default' });
      if (voiceDoc) {
        // Enforce premium check for premium default voices
        if (voiceDoc.isPremium && !user.premiumAccess) {
          return res.status(403).json({ success: false, message: 'Upgrade to Premium to unlock this voice.' });
        }
        baseVoiceId = voiceDoc.voiceId;
        voiceDisplayName = voiceDoc.name || voiceDoc.voiceName;
        console.log(`[TTS] Using system default voice "${voiceDisplayName}" (${baseVoiceId})`);
      } else {
        baseVoiceId = voice;
        voiceDisplayName = voice;
        console.log(`[TTS] Voice doc not found for voiceId "${voice}", falling back to raw ID`);
      }
    }

    const CommClass = await getCommunicateClass();
    const filename = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const rateStr = getRateString(speed);

    // Step 2: Generate Speech Stems
    console.log('Starting speech generation via Edge TTS');
    const communicate = new CommClass(text, {
      voice: baseVoiceId,
      rate: rateStr
    });

    const audioChunks = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('Audio generation returned empty data');
    }

    let audioBuffer = Buffer.concat(audioChunks);

    // Step 3: Run Audio Processor (Pitch, Tone, Depth controls)
    console.log('Applying advanced audio filters (pitch, tone, depth)...');
    audioBuffer = await processAudio(audioBuffer, pitch, tone, depth);

    // Validate Audio Buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio post-processing returned empty buffer');
    }

    // Step 4: Upload audio
    console.log('Uploading processed audio buffer...');
    const audioUrl = await storeAudioBuffer(audioBuffer, 'tts-audio', filename);

    // Step 5: Quota credits consumption
    if (!user.premiumAccess) {
      user.usedCredits += creditsNeeded;
      await user.save();
    }

    // Step 6: Log Audio History entry
    console.log('Saving audio log in history');
    const historyEntry = new AudioHistory({
      userId: user._id,
      text,
      voice: voiceDisplayName,
      voiceId: voice,
      speed: sanitizeSpeed(speed),
      audioUrl,
      characterCount
    });
    await historyEntry.save();

    // Step 7: Record Voice Analytics and Invalidate Cache
    try {
      const audioDuration = await getAudioDuration(audioBuffer);
      const isPremiumVoice = voiceDoc ? voiceDoc.isPremium : false;
      const voiceCategory = voiceDoc ? voiceDoc.category : 'general';

      const analyticsEntry = new VoiceAnalytics({
        userId: user._id,
        voiceId: baseVoiceId,
        voiceName: voiceDisplayName,
        provider: voiceDoc?.provider || 'Microsoft',
        generationCount: 1,
        totalCharacters: characterCount,
        duration: audioDuration,
        isPremium: isPremiumVoice,
        category: voiceCategory,
        createdAt: new Date()
      });
      await analyticsEntry.save();

      // Invalidate cache
      try {
        const { invalidateAnalyticsCache } = require('./analyticsController');
        invalidateAnalyticsCache(user._id);
      } catch (cacheErr) {
        console.warn('Failed to invalidate analytics cache:', cacheErr.message);
      }
    } catch (analyticsErr) {
      console.error('Failed to log voice analytics:', analyticsErr.message);
    }

    return res.status(200).json({
      success: true,
      audioUrl,
      message: 'Speech generated successfully',
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
    return res.status(500).json({
      success: false,
      message: error.message || 'Audio upload failed'
    });
  }
};

// Dedicated Voice Preview Controller
exports.previewSpeech = async (req, res) => {
  const targetVoiceId = req.body.voiceId || req.body.voice;
  const previewText = req.body.text || 'Hi, I am your AI narrator from 21st Tech Company.';
  const speed = req.body.speed !== undefined ? req.body.speed : 1.0;
  const pitch = req.body.pitchOffset !== undefined ? req.body.pitchOffset : (req.body.pitch || 0);
  const depth = req.body.voiceDepth !== undefined ? req.body.voiceDepth : (req.body.depth || 0);
  const tone = req.body.eqPreset || req.body.eq || req.body.tone || 'natural';

  console.log('Preview request params:', { targetVoiceId, pitch, tone, depth, speed });

  if (!targetVoiceId) {
    return res.status(400).json({ success: false, message: 'voiceId is required for preview' });
  }

  // Backend verification for homepage guest requests
  if (!req.user) {
    if (targetVoiceId !== 'en-US-ChristopherNeural') {
      return res.status(403).json({
        success: false,
        message: 'Login required for this voice'
      });
    }
  }

  try {
    // Resolve Voice Profile & check permissions
    let baseVoiceId = targetVoiceId;
    let voiceDoc = null;

    if (mongoose.Types.ObjectId.isValid(targetVoiceId)) {
      voiceDoc = await Voice.findOne({ _id: targetVoiceId, userId: req.user?._id });
      if (!voiceDoc) {
        return res.status(404).json({ success: false, message: 'Custom voice profile not found.' });
      }
      
      if (!req.user || !req.user.premiumAccess) {
        return res.status(403).json({ success: false, message: 'Upgrade to Premium to unlock this voice.' });
      }
      baseVoiceId = 'en-US-ChristopherNeural';
    } else {
      voiceDoc = await Voice.findOne({ voiceId: targetVoiceId, type: 'default' });
      if (voiceDoc) {
        if (voiceDoc.isPremium && (!req.user || !req.user.premiumAccess)) {
          return res.status(403).json({ success: false, message: 'Upgrade to Premium to unlock this voice.' });
        }
        baseVoiceId = voiceDoc.voiceId;
      }
    }

    // Voice Preview Handling
    if (voiceDoc) {
      if (voiceDoc.previewAvailable === false) {
        return res.status(400).json({
          success: false,
          message: 'Preview not available for this voice at the moment.'
        });
      }
      if (voiceDoc.previewUrl) {
        return res.status(200).json({
          success: true,
          audioUrl: voiceDoc.previewUrl,
          message: 'Voice preview loaded from cache successfully'
        });
      }
    }

    const CommClass = await getCommunicateClass();
    const safeVoiceId = targetVoiceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `preview-${safeVoiceId}-${Date.now()}.mp3`;

    console.log('Starting preview speech generation');
    const rateStr = getRateString(speed);
    const communicate = new CommClass(previewText, {
      voice: baseVoiceId,
      rate: rateStr
    });

    const audioChunks = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('Audio generation returned empty data');
    }

    let audioBuffer = Buffer.concat(audioChunks);

    // Apply Audio Filters
    console.log('Applying preview audio filters...');
    audioBuffer = await processAudio(audioBuffer, pitch, tone, depth);

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio preview post-processing returned empty buffer');
    }

    console.log('Uploading preview audio file...');
    const audioUrl = await storeAudioBuffer(audioBuffer, 'tts-previews', filename);

    return res.status(200).json({
      success: true,
      audioUrl,
      message: 'Voice preview generated successfully'
    });

  } catch (error) {
    console.error('Preview Generation Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Audio preview failed'
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
