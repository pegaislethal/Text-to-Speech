const { isCloudinaryConfigured, generateUploadSignature } = require('../config/cloudinary');

/**
 * POST /api/upload/signature
 * Generates signed Cloudinary upload parameters for direct client uploads.
 */
exports.getSignature = async (req, res) => {
  try {
    const user = req.user;

    // Security & Premium Access Check
    if (!user || !user.premiumAccess) {
      return res.status(403).json({
        success: false,
        message: 'Direct uploads are reserved for premium users.'
      });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary storage service is not configured.'
      });
    }

    const folder = req.body?.folder || 'voice-clones/samples';
    const signatureData = generateUploadSignature(folder);

    return res.status(200).json({
      success: true,
      ...signatureData
    });
  } catch (error) {
    console.error('Signature Generation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to upload voice sample.'
    });
  }
};
