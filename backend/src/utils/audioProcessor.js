const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const fsPromises = require('fs').promises;
const pathLib = require('path');
const ffmpegPath = require('ffmpeg-static');

let hasFfmpeg = null;

// Determine if ffmpeg is available on the system
const checkFfmpegAvailability = () => {
  if (hasFfmpeg !== null) return hasFfmpeg;
  try {
    if (ffmpegPath) {
      execSync(`"${ffmpegPath}" -version`, { stdio: 'ignore' });
      hasFfmpeg = true;
      console.log('[AudioProcessor] ffmpeg-static detected. Advanced voice controls are active.');
    } else {
      hasFfmpeg = false;
      console.warn('[AudioProcessor] ffmpeg-static NOT available.');
    }
  } catch (err) {
    hasFfmpeg = false;
    console.warn('[AudioProcessor] Error checking ffmpeg-static:', err.message);
  }
  return hasFfmpeg;
};

/**
 * Apply pitch, tone, and depth adjustments to audio stream buffers.
 */
const processAudio = async (audioBuffer, pitch = 0, tone = 'natural', depth = 0) => {
  const isFfmpegAvailable = checkFfmpegAvailability();
  
  // If no adjustments are requested or ffmpeg is not available, bypass processing
  const noAdjustments = pitch === 0 && (tone === 'natural' || tone === 'neutral') && depth === 0;
  if (!isFfmpegAvailable || noAdjustments) {
    return audioBuffer;
  }

  // Temporary file path generation
  const tempDir = os.tmpdir();
  const randId = crypto.randomBytes(8).toString('hex');
  const tempInputPath = pathLib.join(tempDir, `input_${randId}.mp3`);
  const tempOutputPath = pathLib.join(tempDir, `output_${randId}.mp3`);

  try {
    // 1. Write audio buffer to a temp input file
    await fsPromises.writeFile(tempInputPath, audioBuffer);

    // 2. Build ffmpeg audio filters list
    const filters = [];

    // Apply Pitch Offset (-12 to +12 semitones)
    if (pitch !== 0) {
      // Calculate frequency multiplier based on standard equal temperament formula
      const pitchFactor = Math.pow(2, pitch / 12);
      
      // Chaining atempo filters if pitchFactor is out of bounds [0.5, 2.0]
      let atempoFilter = `atempo=${(1 / pitchFactor).toFixed(2)}`;
      if (1 / pitchFactor < 0.5) {
        atempoFilter = 'atempo=0.5,atempo=' + ((1 / pitchFactor) / 0.5).toFixed(2);
      } else if (1 / pitchFactor > 2.0) {
        atempoFilter = 'atempo=2.0,atempo=' + ((1 / pitchFactor) / 2.0).toFixed(2);
      }
      filters.push(`asetrate=44100*${pitchFactor.toFixed(2)},${atempoFilter}`);
    }

    // Apply Voice Depth (0 to 100) -> boosts bass response below 80Hz
    if (depth > 0) {
      const bassGain = (depth / 100) * 15;
      filters.push(`bass=g=${bassGain.toFixed(1)}:f=80`);
    }

    // Apply Equalizer Tone styles
    if (tone === 'documentary') {
      // Narrative warmth + clarity boost
      filters.push('bass=g=5:f=120,treble=g=3:f=3000');
    } else if (tone === 'cinematic') {
      // Deep bass + high presence + haas filter stereo widening
      filters.push('bass=g=10:f=80,treble=g=2:f=8000,haas');
    } else if (tone === 'podcast') {
      // Warm, balanced podcast/speech tone
      filters.push('equalizer=f=1000:width_type=q:width=1:g=2,equalizer=f=200:width_type=q:width=1:g=1.5');
    } else if (tone === 'radio') {
      // Compressed AM/FM broadcast EQ + dynamic range compression
      filters.push('compand=attacks=0.01:decays=0.1:points=-60/-60|-24/-12|0/-3,equalizer=f=5000:width_type=q:width=1:g=3');
    }

    if (filters.length === 0) {
      return audioBuffer;
    }

    const filterString = filters.join(',');
    
    // 3. Execute ffmpeg process using ffmpeg-static path
    const cmd = `"${ffmpegPath}" -y -i "${tempInputPath}" -af "${filterString}" "${tempOutputPath}"`;
    execSync(cmd, { stdio: 'ignore' });

    // 4. Read processed output back into a buffer
    const processedBuffer = await fsPromises.readFile(tempOutputPath);
    return processedBuffer;

  } catch (err) {
    console.error('[AudioProcessor] ffmpeg-static processing failed:', err.message);
    // Graceful recovery: return original audio stream
    return audioBuffer;
  } finally {
    // 5. Clean up temporary files
    try {
      if (fs.existsSync(tempInputPath)) await fsPromises.unlink(tempInputPath);
      if (fs.existsSync(tempOutputPath)) await fsPromises.unlink(tempOutputPath);
    } catch (_) {}
  }
};

/**
 * Helper function to parse output duration using ffmpeg command line
 */
const getAudioDuration = async (audioBuffer) => {
  const isFfmpegAvailable = checkFfmpegAvailability();
  if (!isFfmpegAvailable) {
    // Basic fallback: roughly 15 characters per second
    return 1;
  }

  const tempDir = os.tmpdir();
  const randId = crypto.randomBytes(8).toString('hex');
  const tempInputPath = pathLib.join(tempDir, `duration_${randId}.mp3`);

  try {
    await fsPromises.writeFile(tempInputPath, audioBuffer);
    const cmd = `"${ffmpegPath}" -i "${tempInputPath}"`;
    let output = '';
    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch (err) {
      // ffmpeg exits with code 1 when no output file is specified, which is fine
      output = err.stderr ? err.stderr.toString() : '';
    }

    const match = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  } catch (err) {
    console.error('[AudioProcessor] Failed to get audio duration:', err.message);
  } finally {
    try {
      if (fs.existsSync(tempInputPath)) await fsPromises.unlink(tempInputPath);
    } catch (_) {}
  }
  return 0;
};

module.exports = { processAudio, getAudioDuration };
