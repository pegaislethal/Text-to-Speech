const Preset = require('../models/preset');

exports.getPresets = async (req, res) => {
  try {
    const presets = await Preset.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, presets });
  } catch (error) {
    console.error('Fetch presets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch presets' });
  }
};

exports.createPreset = async (req, res) => {
  const { presetName, voiceId, speed, settings } = req.body;

  if (!presetName || !voiceId) {
    return res.status(400).json({ success: false, message: 'Preset name and voice ID are required' });
  }

  try {
    const preset = new Preset({
      userId: req.user._id,
      presetName,
      voiceId,
      speed: speed || 1.0,
      settings: settings || {}
    });
    await preset.save();

    res.status(201).json({ success: true, preset });
  } catch (error) {
    console.error('Create preset error:', error);
    res.status(500).json({ success: false, message: 'Failed to save preset' });
  }
};

exports.deletePreset = async (req, res) => {
  const { id } = req.params;

  try {
    const preset = await Preset.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!preset) {
      return res.status(404).json({ success: false, message: 'Preset not found' });
    }
    res.status(200).json({ success: true, message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Delete preset error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete preset' });
  }
};
