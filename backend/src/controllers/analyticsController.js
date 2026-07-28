const VoiceAnalytics = require('../models/voiceAnalytics');
const User = require('../models/user');

const cache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds cache

const getCacheKey = (endpoint, req) => {
  const isGlobal = req.user.role === 'admin' && req.query.global === 'true';
  return `${endpoint}:${isGlobal ? 'global' : req.user._id.toString()}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const invalidateAnalyticsCache = (userId) => {
  if (!userId) return;
  const userStr = userId.toString();
  for (const key of cache.keys()) {
    if (key.includes(userStr) || key.includes('global')) {
      cache.delete(key);
    }
  }
};

exports.invalidateAnalyticsCache = invalidateAnalyticsCache;

exports.getOverview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const isGlobal = true;
    const cacheKey = getCacheKey('overview', req);
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, ...cached });
    }

    const match = {};

    // Get overall stats
    const statsResult = await VoiceAnalytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalGenerations: { $sum: '$generationCount' },
          totalDuration: { $sum: '$duration' },
          totalCharacters: { $sum: '$totalCharacters' }
        }
      }
    ]);

    const stats = statsResult[0] || { totalGenerations: 0, totalDuration: 0, totalCharacters: 0 };

    // Get most used voice
    const mostUsedResult = await VoiceAnalytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$voiceName',
          usageCount: { $sum: '$generationCount' }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 1 }
    ]);

    const mostUsedVoice = mostUsedResult[0] ? mostUsedResult[0]._id : 'None';

    const responseData = {
      totalGenerations: stats.totalGenerations,
      totalDuration: stats.totalDuration,
      totalCharacters: stats.totalCharacters,
      mostUsedVoice
    };

    if (isGlobal) {
      // Admin dashboard additions
      const totalUsers = await User.countDocuments();
      
      // Premium usage
      const premiumUsageResult = await VoiceAnalytics.aggregate([
        { $match: { isPremium: true } },
        {
          $group: {
            _id: null,
            count: { $sum: '$generationCount' }
          }
        }
      ]);
      const premiumUsage = premiumUsageResult[0] ? premiumUsageResult[0].count : 0;

      responseData.totalUsers = totalUsers;
      responseData.premiumUsage = premiumUsage;
    }

    setCachedData(cacheKey, responseData);
    return res.status(200).json({ success: true, ...responseData });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics overview' });
  }
};

exports.getVoices = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const isGlobal = true;
    const cacheKey = getCacheKey('voices', req);
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, voices: cached });
    }

    const match = {};

    const voiceStats = await VoiceAnalytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$voiceName',
          voiceId: { $first: '$voiceId' },
          category: { $first: '$category' },
          usageCount: { $sum: '$generationCount' }
        }
      },
      { $sort: { usageCount: -1 } }
    ]);

    const totalUsage = voiceStats.reduce((sum, item) => sum + item.usageCount, 0);

    const voices = voiceStats.map(item => ({
      voiceName: item._id,
      voiceId: item.voiceId,
      category: item.category || 'general',
      usageCount: item.usageCount,
      percentage: totalUsage > 0 ? Math.round((item.usageCount / totalUsage) * 100) : 0
    }));

    setCachedData(cacheKey, voices);
    return res.status(200).json({ success: true, voices });
  } catch (error) {
    console.error('Error fetching voice analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch voice analytics' });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const isGlobal = true;
    const cacheKey = getCacheKey('timeline', req);
    const cached = getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, timeline: cached });
    }

    const match = {};

    // Group by day of generation
    const timelineData = await VoiceAnalytics.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          generations: { $sum: '$generationCount' },
          duration: { $sum: '$duration' },
          characters: { $sum: '$totalCharacters' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const timeline = timelineData.map(item => ({
      date: item._id,
      generations: item.generations,
      duration: Math.round(item.duration),
      characters: item.characters
    }));

    setCachedData(cacheKey, timeline);
    return res.status(200).json({ success: true, timeline });
  } catch (error) {
    console.error('Error fetching timeline analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch timeline analytics' });
  }
};

exports.seedMockData = async (req, res) => {
  try {
    const Voice = require('../models/voice');
    
    // Clear previous analytics
    await VoiceAnalytics.deleteMany({});

    // Find a regular user
    const regularUser = await User.findOne({ role: 'user' });
    if (!regularUser) {
      return res.status(400).json({ success: false, message: 'No user found. Please sign up first.' });
    }

    const now = new Date();
    const mockData = [
      { voiceName: 'Deep Documentary Male', voiceId: 'en-US-ChristopherNeural', category: 'documentary', characters: 1500, duration: 110, isPremium: false, daysAgo: 0, count: 5 },
      { voiceName: 'Ancient History Narrator', voiceId: 'en-GB-RyanNeural', category: 'documentary', characters: 800, duration: 65, isPremium: true, daysAgo: 0, count: 3 },
      { voiceName: 'Educational Female', voiceId: 'en-US-JennyNeural', category: 'female', characters: 350, duration: 25, isPremium: false, daysAgo: 0, count: 2 },
      
      { voiceName: 'Deep Documentary Male', voiceId: 'en-US-ChristopherNeural', category: 'documentary', characters: 2400, duration: 180, isPremium: false, daysAgo: 1, count: 8 },
      { voiceName: 'Storytelling Female', voiceId: 'en-US-MichelleNeural', category: 'female', characters: 1200, duration: 95, isPremium: false, daysAgo: 1, count: 4 },
      { voiceName: 'Emotional Storyteller', voiceId: 'en-US-EmmaNeural', category: 'storytelling', characters: 900, duration: 75, isPremium: true, daysAgo: 1, count: 3 },
      
      { voiceName: 'Deep Documentary Male', voiceId: 'en-US-ChristopherNeural', category: 'documentary', characters: 1200, duration: 90, isPremium: false, daysAgo: 2, count: 4 },
      { voiceName: 'Calm Narrator Male', voiceId: 'en-US-BrianNeural', category: 'male', characters: 600, duration: 50, isPremium: false, daysAgo: 2, count: 2 },
      
      { voiceName: 'Ancient History Narrator', voiceId: 'en-GB-RyanNeural', category: 'documentary', characters: 1500, duration: 120, isPremium: true, daysAgo: 3, count: 5 },
      { voiceName: 'Storytelling Female', voiceId: 'en-US-MichelleNeural', category: 'female', characters: 900, duration: 70, isPremium: false, daysAgo: 3, count: 3 },
      
      { voiceName: 'Deep Documentary Male', voiceId: 'en-US-ChristopherNeural', category: 'documentary', characters: 3000, duration: 240, isPremium: false, daysAgo: 4, count: 10 },
      { voiceName: 'Emotional Storyteller', voiceId: 'en-US-EmmaNeural', category: 'storytelling', characters: 600, duration: 50, isPremium: true, daysAgo: 4, count: 2 }
    ];

    const analyticsDocs = [];
    for (const item of mockData) {
      const generatedDate = new Date();
      generatedDate.setDate(now.getDate() - item.daysAgo);

      for (let i = 0; i < item.count; i++) {
        analyticsDocs.push({
          userId: regularUser._id,
          voiceId: item.voiceId,
          voiceName: item.voiceName,
          provider: 'Microsoft',
          generationCount: 1,
          totalCharacters: Math.round(item.characters / item.count),
          duration: item.duration / item.count,
          isPremium: item.isPremium,
          category: item.category,
          createdAt: generatedDate
        });
      }
    }

    await VoiceAnalytics.insertMany(analyticsDocs);

    // Update Calm Narrator Male to have previewAvailable: false
    await Voice.updateOne(
      { voiceId: 'en-US-BrianNeural' },
      { $set: { previewAvailable: false } }
    );

    // Clear caches
    invalidateAnalyticsCache(regularUser._id);

    return res.status(200).json({ success: true, message: 'Seeded analytics successfully!', count: analyticsDocs.length });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
