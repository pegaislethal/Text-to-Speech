const xttsProvider = require('./providers/xttsProvider');
const openVoiceProvider = require('./providers/openVoiceProvider');

/**
 * Unified Voice Cloning Service Router
 */
class VoiceCloningService {
  constructor() {
    this.providers = {
      XTTS: xttsProvider,
      OpenVoice: openVoiceProvider
    };
  }

  /**
   * Route voice cloning requests to specified provider (default: XTTS)
   */
  async cloneVoice(userId, voiceName, audioBuffer, filename, providerName = 'XTTS') {
    const provider = this.providers[providerName] || this.providers.XTTS;
    return await provider.cloneVoice(userId, voiceName, audioBuffer, filename);
  }

  /**
   * Check if provider is supported
   */
  isProviderSupported(providerName) {
    return Boolean(this.providers[providerName]);
  }
}

module.exports = new VoiceCloningService();
