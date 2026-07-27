const mongoose = require('mongoose');
const Voice = require('../models/voice');

let isConnected = false;

const seedVoices = async () => {
  try {
    const count = await Voice.countDocuments({ type: 'default' });
    if (count === 0) {
      console.log('[Database] Seeding 13 default platform voices...');
      const defaultVoices = [
        {
          name: 'Deep Documentary Male',
          voiceName: 'Deep Documentary Male',
          voiceId: 'en-US-ChristopherNeural',
          provider: 'Microsoft',
          category: 'documentary',
          description: 'Deep, cinematic, and calm tone modeled for National Geographic & nature documentaries.',
          isPremium: false,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Calm Narrator Male',
          voiceName: 'Calm Narrator Male',
          voiceId: 'en-US-BrianNeural',
          provider: 'Microsoft',
          category: 'male',
          description: 'Soft, steady pacing optimized for guided meditations and background essays.',
          isPremium: false,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Professional Male',
          voiceName: 'Professional Male',
          voiceId: 'en-GB-ThomasNeural',
          provider: 'Microsoft',
          category: 'male',
          description: 'Articulate British corporate cadence suited for business pitches and tutorials.',
          isPremium: false,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Educational Female',
          voiceName: 'Educational Female',
          voiceId: 'en-US-JennyNeural',
          provider: 'Microsoft',
          category: 'female',
          description: 'Clear, engaging, and professional female voice optimized for instruction.',
          isPremium: false,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Storytelling Female',
          voiceName: 'Storytelling Female',
          voiceId: 'en-US-MichelleNeural',
          provider: 'Microsoft',
          category: 'female',
          description: 'Warm and expressive narration style suited for audiobooks and storybooks.',
          isPremium: false,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Ancient History Narrator',
          voiceName: 'Ancient History Narrator',
          voiceId: 'en-GB-RyanNeural',
          provider: 'Microsoft',
          category: 'documentary',
          description: 'Slow, resonant British accent with emotional weight for historical & epic audiobooks.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Wildlife Documentary Voice',
          voiceName: 'Wildlife Documentary Voice',
          voiceId: 'en-US-SteffanNeural',
          provider: 'Microsoft',
          category: 'documentary',
          description: 'Clean, warm, narrative pitch ideal for scientific and wildlife features.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Dark Mystery Narrator',
          voiceName: 'Dark Mystery Narrator',
          voiceId: 'en-US-EricNeural',
          provider: 'Microsoft',
          category: 'documentary',
          description: 'Low pitch, dramatic, and moody cadence tailored for mystery and thriller narration.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Cinematic Trailer Voice',
          voiceName: 'Cinematic Trailer Voice',
          voiceId: 'en-US-GuyNeural',
          provider: 'Microsoft',
          category: 'documentary',
          description: 'Expressive, storytelling pacing for film trailers and audiobook narratives.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'News Anchor Voice',
          voiceName: 'News Anchor Voice',
          voiceId: 'en-US-AndrewNeural',
          provider: 'Microsoft',
          category: 'male',
          description: 'Clear, warm, articulate tone optimized for technical podcasts and interviews.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Emotional Storyteller',
          voiceName: 'Emotional Storyteller',
          voiceId: 'en-US-EmmaNeural',
          provider: 'Microsoft',
          category: 'female',
          description: 'Expressive and friendly voice with dynamic emotional range for narration.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Deep Cinematic Male',
          voiceName: 'Deep Cinematic Male',
          voiceId: 'en-US-RogerNeural',
          provider: 'Microsoft',
          category: 'male',
          description: 'Strong, deep, bass-rich tone suited for advertising and movie voiceovers.',
          isPremium: true,
          isActive: true,
          type: 'default'
        },
        {
          name: 'Luxury Podcast Voice',
          voiceName: 'Luxury Podcast Voice',
          voiceId: 'en-US-AvaNeural',
          provider: 'Microsoft',
          category: 'female',
          description: 'Smooth, polished, and sophisticated female voice for luxury branding and podcasts.',
          isPremium: true,
          isActive: true,
          type: 'default'
        }
      ];

      await Voice.insertMany(defaultVoices);
      console.log('[Database] Seeded 13 default platform voices successfully.');
    }
  } catch (err) {
    console.error('[Database] Seeding default voices failed:', err);
  }
};

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('CRITICAL: MONGODB_URI environment variable is missing.');
    throw new Error('Database configuration error: MONGODB_URI is missing in environment variables.');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed system default voices
    await seedVoices();
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    isConnected = false;
    throw error;
  }
};

module.exports = connectDB;
