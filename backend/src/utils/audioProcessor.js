const { execSync } = require('child_process');
const fs = require('fs');
const path = require('fs');
const os = require('os');
const crypto = require('crypto');
const fsPromises = require('fs').promises;
const pathLib = require('path');

let hasFfmpeg = null;

// Determine if ffmpeg is available on the system
const checkFfmpegAvailability = () => {
  if (hasFfmpeg !== null) return hasFfmpeg;
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    hasFfmpeg = true;
    console.log('[AudioProcessor] ffmpeg detected. Advanced voice controls are active.');
  } catch (err) {
    hasFfmpeg = false;
    console.warn('[AudioProcessor] ffmpeg NOT found. Running in simulation fallback mode.');
  }
  return hasFfmpeg;
};

/**
 * Apply pitch, tone, and depth adjustments to audio stream buffers.
 */
const processAudio = async (audioBuffer, pitch = 0, tone = 'neutral', depth = 0) => {
  const isFfmpegAvailable = checkFfmpegAvailability();
  
  // If no adjustments are requested or ffmpeg is not available, bypass processing
  const noAdjustments = pitch === 0 && tone === 'neutral' && depth === 0;
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

    // Apply Pitch (-20 to +20) -> shifts sampling rate and corrects tempo
    if (pitch !== 0) {
      // map pitch scale from -20 => 0.6 to +20 => 1.4
      const pitchFactor = 1.0 + (pitch / 50); 
      filters.push(`asetrate=44100*${pitchFactor.toFixed(2)},atempo=${(1 / pitchFactor).toFixed(2)}`);
    }

    // Apply Voice Depth (0 to 100) -> boosts bass response below 120Hz
    if (depth > 0) {
      const bassGain = Math.round((depth / 100) * 14);
      filters.push(`bass=g=${bassGain}:f=100`);
    }

    // Apply Equalizer Tone styles
    if (tone === 'deep') {
      filters.push('bass=g=8:f=120');
    } else if (tone === 'warm') {
      filters.push('bass=g=5:f=150,treble=g=-2');
    } else if (tone === 'professional') {
      filters.push('equalizer=f=3000:width_type=h:width=200:g=3,bass=g=2');
    } else if (tone === 'cinematic') {
      filters.push('bass=g=10:f=80,treble=g=3:f=8000');
    } else if (tone === 'dramatic') {
      filters.push('equalizer=f=1000:width_type=h:width=400:g=-3,bass=g=7');
    }

    if (filters.length === 0) {
      return audioBuffer;
    }

    const filterString = filters.join(',');
    
    // 3. Execute ffmpeg process synchronously (fast execution on small temp files)
    const cmd = `ffmpeg -y -i "${tempInputPath}" -af "${filterString}" "${tempOutputPath}"`;
    execSync(cmd, { stdio: 'ignore' });

    // 4. Read processed output back into a buffer
    const processedBuffer = await fsPromises.readFile(tempOutputPath);
    return processedBuffer;

  } catch (err) {
    console.error('[AudioProcessor] ffmpeg processing failed:', err.message);
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

module.exports = { processAudio };
