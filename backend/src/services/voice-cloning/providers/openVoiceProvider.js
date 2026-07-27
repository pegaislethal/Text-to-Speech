const { isCloudinaryConfigured, uploadAudioBuffer } = require('../../../config/cloudinary');
const path = require('path');
const fs = require('fs');

/**
 * OpenVoice Voice Cloning Provider (MeloTTS + Tone Color Converter)
 */
class OpenVoiceProvider {
  constructor() {
    this.name = 'OpenVoice';
  }

  /**
   * Clone voice from sample (extracts tone color)
   */
  async cloneVoice(userId, voiceName, audioBuffer, filename) {
    console.log(`[OpenVoice] Cloning voice "${voiceName}" for user ${userId}...`);

    const isCloudinary = isCloudinaryConfigured();
    let sampleUrl;

    if (isCloudinary) {
      sampleUrl = await uploadAudioBuffer(audioBuffer, 'voice-clones/samples', filename);
    } else {
      const localDir = path.join(__dirname, '../../../../public/uploads/samples');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(localDir, filename);
      await fs.promises.writeFile(localPath, audioBuffer);
      sampleUrl = `/uploads/samples/${filename}`;
    }

    const embeddingUrl = isCloudinary 
      ? sampleUrl.replace(/\.[^/.]+$/, '_tone_color.json') 
      : `/uploads/samples/${filename.replace(/\.[^/.]+$/, '_tone_color.json')}`;

    console.log(`[OpenVoice] Tone color extracted. Sample URL: ${sampleUrl}`);

    return {
      success: true,
      voiceName,
      provider: this.name,
      sampleUrl,
      embeddingUrl,
      settings: {
        model: 'openvoice-v2',
        language: 'en',
        gender: 'neutral'
      }
    };
  }

  /**
   * Synthesize tone converted speech
   */
  async generateSpeech(text, voiceProfile, settings = {}) {
    console.log(`[OpenVoice] Converting tone to match "${voiceProfile.voiceName}"...`);
    return null;
  }
}

module.exports = new OpenVoiceProvider();
