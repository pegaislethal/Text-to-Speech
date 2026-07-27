const cloudinary = require('cloudinary').v2;

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload an audio Buffer to Cloudinary
 * @param {Buffer} buffer - Audio file binary buffer
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} filename - Base filename without extension (optional)
 * @returns {Promise<string>} Secure Cloudinary URL
 */
const uploadAudioBuffer = (buffer, folder = 'tts-audio', filename = null) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary environment variables are not configured.'));
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadOptions = {
      resource_type: 'video', // Cloudinary classifies audio files (mp3, wav, etc.) under resource_type 'video'
      folder: folder,
    };

    if (filename) {
      uploadOptions.public_id = filename.replace(/\.[^/.]+$/, '');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error);
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary response missing secure_url'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload an image Buffer or Base64 string to Cloudinary
 * @param {Buffer|string} input - Image file binary buffer or Base64 string
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} filename - Base filename without extension (optional)
 * @returns {Promise<string>} Secure Cloudinary URL
 */
const uploadImageBuffer = (input, folder = 'user-profiles', filename = null) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary environment variables are not configured.'));
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadOptions = {
      resource_type: 'image',
      folder: folder,
    };

    if (filename) {
      uploadOptions.public_id = filename.replace(/\.[^/.]+$/, '');
    }

    if (typeof input === 'string') {
      // Base64 string upload
      cloudinary.uploader.upload(input, uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary Image Upload Error:', error);
          return reject(error);
        }
        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary response missing secure_url'));
        }
        resolve(result.secure_url);
      });
    } else {
      // Binary Buffer upload
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary Image Stream Upload Error:', error);
            return reject(error);
          }
          if (!result || !result.secure_url) {
            return reject(new Error('Cloudinary response missing secure_url'));
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(input);
    }
  });
};

/**
 * Generate a signed upload signature for direct client uploads
 * @param {string} folder - Destination folder in Cloudinary
 * @returns {object} { signature, timestamp, cloudName, apiKey, folder }
 */
const generateUploadSignature = (folder = 'voice-clones/samples') => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary environment variables are not configured.');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp: timestamp,
    folder: folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadAudioBuffer,
  uploadImageBuffer,
  generateUploadSignature,
};

