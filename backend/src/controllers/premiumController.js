const fs = require('fs');
const path = require('path');
const SceneVoiceGeneration = require('../models/sceneVoiceGeneration');
const { parseScriptIntoScenes } = require('../utils/aiScriptParser');
const { isCloudinaryConfigured, uploadAudioBuffer } = require('../config/cloudinary');
const { processAudio } = require('../utils/audioProcessor');

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

const storeSceneAudioBuffer = async (audioBuffer, filename) => {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio generation returned empty data');
  }

  const hasCloudinary = isCloudinaryConfigured();
  const isVercel = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);

  if (hasCloudinary) {
    console.log('Uploading scene audio to Cloudinary...');
    return await uploadAudioBuffer(audioBuffer, 'tts-scenes', filename);
  }

  if (isVercel || process.env.NODE_ENV === 'production') {
    throw new Error(
      'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing.'
    );
  }

  // Local filesystem fallback (used only for non-Vercel local development)
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
    throw new Error(`Local file storage failed: ${fsErr.message}`);
  }
};

exports.generateSceneVoices = async (req, res) => {
  const { script, voiceId, speed = 1.0, pitch = 0, tone = 'neutral', depth = 0 } = req.body;
  const user = req.user;

  console.log('AI Scene Voice Generation Request:', {
    userId: user._id,
    scriptLength: script?.length,
    voiceId,
    speed,
    pitch,
    tone,
    depth
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

      // Log Step 1: Before TTS
      console.log(`Starting speech generation for Scene ${scene.sceneNumber}`);

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
        throw new Error(`Audio generation returned empty data for Scene ${scene.sceneNumber}`);
      }

      let audioBuffer = Buffer.concat(audioChunks);

      // Validate buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error(`Audio generation returned empty data for Scene ${scene.sceneNumber}`);
      }

      // Log Step 2: After TTS & Advanced Filtering
      console.log(`Audio generated successfully for Scene ${scene.sceneNumber}. Applying filters...`);
      audioBuffer = await processAudio(audioBuffer, pitch, tone, depth);

      // Log Step 3: Before Upload
      console.log(`Uploading audio for Scene ${scene.sceneNumber}`);
      const audioUrl = await storeSceneAudioBuffer(audioBuffer, diskFilename);

      // Log Step 4: After Upload
      console.log(`Audio uploaded successfully for Scene ${scene.sceneNumber}`);

      generatedScenes.push({
        sceneNumber: scene.sceneNumber,
        text: scene.text,
        audioUrl,
        filename: userFilename
      });
    }

    // Log Step 5: Before Database Save
    console.log('Saving audio URL');
    const record = new SceneVoiceGeneration({
      userId: user._id,
      originalScript: script,
      scenes: generatedScenes,
      voiceId,
      speed: sanitizeSpeed(speed)
    });
    await record.save();

    return res.status(200).json({
      success: true,
      scenes: generatedScenes,
      message: 'Scene speech generated successfully'
    });

  } catch (error) {
    console.error('AI Scene Generation Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Audio upload failed'
    });
  }
};

exports.downloadScenesZip = async (req, res) => {
  const { scenes } = req.body;

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No generated scenes available.'
    });
  }

  try {
    // Sort scenes numerically by sceneNumber to preserve proper numeric sequence (Scene0, Scene1 ... Scene10)
    const sortedScenes = [...scenes].sort((a, b) => {
      const numA = typeof a.sceneNumber === 'number' ? a.sceneNumber : parseInt(a.sceneNumber, 10);
      const numB = typeof b.sceneNumber === 'number' ? b.sceneNumber : parseInt(b.sceneNumber, 10);
      return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
    });

    // Validate and load audio buffers before initializing ZIP stream
    const filesToZip = [];

    for (const scene of sortedScenes) {
      const sceneNum = (scene.sceneNumber !== undefined && scene.sceneNumber !== null && !isNaN(parseInt(scene.sceneNumber, 10)))
        ? parseInt(scene.sceneNumber, 10)
        : 0;

      const filenameInsideZip = `Scene${sceneNum}.mp3`;

      if (!scene.audioUrl) {
        return res.status(400).json({
          success: false,
          message: `Scene ${sceneNum} audio could not be added to ZIP.`
        });
      }

      let buffer = null;

      if (scene.audioUrl.startsWith('http://') || scene.audioUrl.startsWith('https://')) {
        try {
          const fetchRes = await fetch(scene.audioUrl);
          if (!fetchRes.ok) {
            return res.status(400).json({
              success: false,
              message: `Scene ${sceneNum} audio could not be added to ZIP.`
            });
          }
          const arrayBuffer = await fetchRes.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } catch (fetchErr) {
          console.error(`Fetch error for Scene ${sceneNum}:`, fetchErr);
          return res.status(400).json({
            success: false,
            message: `Scene ${sceneNum} audio could not be added to ZIP.`
          });
        }
      } else {
        const cleanPath = scene.audioUrl.startsWith('/') ? scene.audioUrl : `/${scene.audioUrl}`;
        const localPath = path.join(__dirname, '../../public', cleanPath);
        if (!fs.existsSync(localPath)) {
          return res.status(400).json({
            success: false,
            message: `Scene ${sceneNum} audio could not be added to ZIP.`
          });
        }
        try {
          buffer = fs.readFileSync(localPath);
        } catch (readErr) {
          console.error(`Read error for Scene ${sceneNum}:`, readErr);
          return res.status(400).json({
            success: false,
            message: `Scene ${sceneNum} audio could not be added to ZIP.`
          });
        }
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Scene ${sceneNum} audio could not be added to ZIP.`
        });
      }

      filesToZip.push({ name: filenameInsideZip, buffer });
    }

    const archiverModule = await import('archiver');
    const archiver = archiverModule.default || archiverModule;

    const dateStr = new Date().toISOString().split('T')[0];
    const zipFilename = `scene_audio_generation_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('ZIP archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Unable to create ZIP file.' });
      }
    });

    archive.pipe(res);

    for (const fileItem of filesToZip) {
      archive.append(fileItem.buffer, { name: fileItem.name });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Download scenes ZIP error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Unable to create ZIP file.'
      });
    }
  }
};
