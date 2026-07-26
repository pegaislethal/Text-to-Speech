const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const ttsController = require('../controllers/ttsController');
const adminController = require('../controllers/adminController');
const presetController = require('../controllers/presetController');
const premiumController = require('../controllers/premiumController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const premiumMiddleware = require('../middleware/premiumMiddleware');


router.get('/', (req, res) => {
  console.log("Deployed");
  res.status(200).json({ message: "Deployed" });
});
// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Backend running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Authentication Routes
console.log('Google auth route initialized');
router.post('/auth/google', authController.googleLogin);
router.post('/auth/signup', authController.userSignup);
router.post('/auth/login', authController.userLogin);
router.post('/auth/admin/signup', authController.adminSignup);
router.post('/auth/admin/login', authController.adminLogin);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    authenticated: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profileImage: req.user.profileImageUrl || req.user.profileImage,
      profileImageUrl: req.user.profileImageUrl || req.user.profileImage,
      bio: req.user.bio || '',
      role: req.user.role,
      premiumAccess: req.user.premiumAccess,
      freeCredits: req.user.freeCredits,
      usedCredits: req.user.usedCredits,
      createdAt: req.user.createdAt
    }
  });
});

// User Profile Management Routes
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);
router.post('/user/profile/image', authMiddleware, userController.uploadProfileImage);
router.delete('/user/profile/image', authMiddleware, userController.removeProfileImage);

// Premium Operations
router.post('/premium/scene-generator', authMiddleware, premiumMiddleware, premiumController.generateSceneVoices);
router.post('/premium/download-scenes-zip', authMiddleware, premiumMiddleware, premiumController.downloadScenesZip);

// TTS Operations
router.post('/tts/generate', authMiddleware, ttsController.generateSpeech);
router.post('/tts/preview', ttsController.previewSpeech);
router.get('/history', authMiddleware, ttsController.getHistory);
router.delete('/history/:id', authMiddleware, ttsController.deleteHistoryItem);
router.delete('/history', authMiddleware, ttsController.clearHistory);

// Preset Operations
router.get('/presets', authMiddleware, presetController.getPresets);
router.post('/presets', authMiddleware, presetController.createPreset);
router.delete('/presets/:id', authMiddleware, presetController.deletePreset);

// Admin Operations
router.get('/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.patch('/admin/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);
router.patch('/admin/users/:id/premium', authMiddleware, adminMiddleware, adminController.togglePremium);
router.get('/admin/stats', authMiddleware, adminMiddleware, adminController.getStats);
router.get('/admin/settings', authMiddleware, adminMiddleware, adminController.getSettings);
router.patch('/admin/settings', authMiddleware, adminMiddleware, adminController.updateSettings);

module.exports = router;
