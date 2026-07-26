const fs = require('fs');
const path = require('path');
const SceneVoiceGeneration = require('../models/sceneVoiceGeneration');
const { parseScriptIntoScenes } = require('../utils/aiScriptParser');
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

const storeSceneAudioBuffer = async (audioBuffer, filename) => {
  const hasCloudinary = isCloudinaryConfigured();

  if (hasCloudinary) {
    try {
      return await uploadAudioBuffer(audioBuffer, 'tts-scenes', filename);
    } catch (cloudErr) {
      console.error('Cloudinary scene audio upload failed, falling back to local storage:', cloudErr);
    }
  }

  // Local filesystem fallback (used if Cloudinary is unconfigured or upload fails)
  try {
    const scenesDir = path.join(__dirname, '../../public/audio/scenes');
    if (!fs.existsSync(scenesDir)) {
      fs.mkdirSync(scenesDir, { recursive: true });
    }
    const outputPath = path.join(scenesDir, filename);
    await fs.promises.writeFile(outputPath, audioBuffer);
    return `/audio/scenes/${filename}`;
  } catch (fsErr) {
    console.error('Local scene audio storage failed:', fsErr);
    throw new Error('STORAGE_UNAVAILABLE');
  }
};

exports.generateSceneVoices = async (req, res) => {
  const { script, voiceId, speed = 1.0 } = req.body;
  const user = req.user;

  console.log('AI Scene Voice Generation Request:', {
    userId: user._id,
    scriptLength: script?.length,
    voiceId,
    speed
  });

  if (!user.premiumAccess) {
    return res.status(403).json({
      success: false,
      message: 'This feature is available only for premium users.'
    });
  }

  if (!script || !script.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a script before generating scene voices.'
    });
  }

  if (!voiceId) {
    return res.status(400).json({
      success: false,
      message: 'voiceId is required'
    });
  }

  // Step 1: 21st Tech AI Script Parser
  const parsedScenes = parseScriptIntoScenes(script);

  if (parsedScenes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please format your script using Scene1, Scene2...'
    });
  }

  try {
    const CommClass = await getCommunicateClass();
    const rateStr = getRateString(speed);
    const timestamp = Date.now();
    const generatedScenes = [];

    // Step 2 & 3: Generate TTS Audio Clips for each scene
    for (const scene of parsedScenes) {
      const paddedNumber = String(scene.sceneNumber).padStart(2, '0');
      const userFilename = `scene_${paddedNumber}.mp3`;
      const diskFilename = `scene_${paddedNumber}_${timestamp}_${Math.random().toString(36).substring(7)}.mp3`;

      console.log(`Generating scene ${scene.sceneNumber} voice: "${scene.text.substring(0, 30)}..."`);

      const communicate = new CommClass(scene.text, {
        voice: voiceId,
        rate: rateStr
      });

      const audioChunks = [];

      for await (const chunk of communicate.stream()) {
        if (chunk.type === 'audio' && chunk.data) {
          audioChunks.push(chunk.data);
        }
      }

      if (audioChunks.length === 0) {
        throw new Error(`Unable to generate scene audio for Scene ${scene.sceneNumber}`);
      }

      const audioBuffer = Buffer.concat(audioChunks);
      const audioUrl = await storeSceneAudioBuffer(audioBuffer, diskFilename);

      generatedScenes.push({
        sceneNumber: scene.sceneNumber,
        text: scene.text,
        audioUrl,
        filename: userFilename
      });
    }

    // Step 4: Save Record to MongoDB
    const record = new SceneVoiceGeneration({
      userId: user._id,
      originalScript: script,
      scenes: generatedScenes,
      voiceId,
      speed
    });
    await record.save();

    return res.status(200).json({
      success: true,
      scenes: generatedScenes
    });

  } catch (error) {
    console.error('AI Scene Generation Error:', error);
    if (error.message === 'STORAGE_UNAVAILABLE' || error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        message: 'Unable to store generated audio'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Unable to generate scene audio: ' + error.message
    });
  }
};
