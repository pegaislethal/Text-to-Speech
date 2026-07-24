const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const ttsController = require('../controllers/ttsController');
const adminController = require('../controllers/adminController');
const presetController = require('../controllers/presetController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.get('/',)
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
router.post('/auth/admin/signup', authController.adminSignup);
router.post('/auth/admin/login', authController.adminLogin);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authMiddleware, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

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
