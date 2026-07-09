const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const ttsController = require('../controllers/ttsController');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Authentication
router.post('/auth/google', authController.googleLogin);
router.get('/auth/me', requireAuth, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// TTS Operations
router.post('/tts/generate', requireAuth, ttsController.generateSpeech);
router.get('/history', requireAuth, ttsController.getHistory);

// Admin Operations
router.get('/admin/users', requireAuth, requireAdmin, adminController.getUsers);
router.patch('/admin/users/:id', requireAuth, requireAdmin, adminController.updateUser);
router.delete('/admin/users/:id', requireAuth, requireAdmin, adminController.deleteUser);
router.patch('/admin/users/:id/premium', requireAuth, requireAdmin, adminController.togglePremium);
router.get('/admin/stats', requireAuth, requireAdmin, adminController.getStats);
router.get('/admin/settings', requireAuth, requireAdmin, adminController.getSettings);
router.patch('/admin/settings', requireAuth, requireAdmin, adminController.updateSettings);

module.exports = router;
