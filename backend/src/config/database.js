const mongoose = require('mongoose');
const Voice = require('../models/voice');

let isConnected = false;

const seedVoices = async () => {
  try {
    console.log('[Database] Synchronizing 13 curated platform voices (5 Free, 8 Premium)...');
    const defaultVoices = [
      {
        name: 'Deep Documentary Male',
        voiceName: 'Deep Documentary Male',
        voiceId: 'en-US-ChristopherNeural',
        provider: 'Microsoft Azure',
        category: 'documentary',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Dark, deep, cinematic narrator tone',
        description: 'Deep, cinematic, and calm tone modeled for National Geographic & nature documentaries.',
        isPremium: false,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Calm Narrator Male',
        voiceName: 'Calm Narrator Male',
        voiceId: 'en-US-BrianNeural',
        provider: 'Microsoft Azure',
        category: 'male',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Calm, steady, reflective narrator',
        description: 'Soft, steady pacing optimized for guided meditations, essay narration, and tutorials.',
        isPremium: false,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Professional Male',
        voiceName: 'Professional Male',
        voiceId: 'en-GB-ThomasNeural',
        provider: 'Microsoft Azure',
        category: 'male',
        gender: 'Male',
        accent: 'British',
        language: 'en-GB',
        style: 'Articulate, corporate, authoritative',
        description: 'Articulate British corporate cadence suited for business pitches and tutorials.',
        isPremium: false,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Educational Female',
        voiceName: 'Educational Female',
        voiceId: 'en-US-JennyNeural',
        provider: 'Microsoft Azure',
        category: 'female',
        gender: 'Female',
        accent: 'American',
        language: 'en-US',
        style: 'Clear, engaging, instructional',
        description: 'Clear, engaging, and professional female voice optimized for instruction.',
        isPremium: false,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Storytelling Female',
        voiceName: 'Storytelling Female',
        voiceId: 'en-US-MichelleNeural',
        provider: 'Microsoft Azure',
        category: 'female',
        gender: 'Female',
        accent: 'American',
        language: 'en-US',
        style: 'Warm, expressive, audiobooks',
        description: 'Warm and expressive narration style suited for audiobooks and storybooks.',
        isPremium: false,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Ancient History Narrator',
        voiceName: 'Ancient History Narrator',
        voiceId: 'en-GB-RyanNeural',
        provider: 'Microsoft Azure',
        category: 'documentary',
        gender: 'Male',
        accent: 'British',
        language: 'en-GB',
        style: 'Slow, resonant, historical weight',
        description: 'Slow, resonant British accent with emotional weight for historical & epic audiobooks.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Wildlife Documentary Voice',
        voiceName: 'Wildlife Documentary Voice',
        voiceId: 'en-US-SteffanNeural',
        provider: 'Microsoft Azure',
        category: 'documentary',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Warm, scientific, BBC/NatGeo style',
        description: 'Clean, warm, narrative pitch ideal for scientific and wildlife features.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Dark Mystery Narrator',
        voiceName: 'Dark Mystery Narrator',
        voiceId: 'en-US-EricNeural',
        provider: 'Microsoft Azure',
        category: 'documentary',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Low pitch, suspenseful, true crime',
        description: 'Low pitch, dramatic, and moody cadence tailored for mystery and thriller narration.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Cinematic Trailer Voice',
        voiceName: 'Cinematic Trailer Voice',
        voiceId: 'en-US-GuyNeural',
        provider: 'Microsoft Azure',
        category: 'documentary',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Powerful, deep bass, blockbuster trailer',
        description: 'Expressive, storytelling pacing for film trailers and audiobook narratives.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'News Anchor Voice',
        voiceName: 'News Anchor Voice',
        voiceId: 'en-US-AndrewNeural',
        provider: 'Microsoft Azure',
        category: 'male',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Articulate, broadcast, tech podcast',
        description: 'Clear, warm, articulate tone optimized for technical podcasts and interviews.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Emotional Storyteller',
        voiceName: 'Emotional Storyteller',
        voiceId: 'en-US-EmmaNeural',
        provider: 'Microsoft Azure',
        category: 'female',
        gender: 'Female',
        accent: 'American',
        language: 'en-US',
        style: 'Dynamic range, dramatic audiobooks',
        description: 'Expressive and friendly voice with dynamic emotional range for narration.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Deep Cinematic Male',
        voiceName: 'Deep Cinematic Male',
        voiceId: 'en-US-RogerNeural',
        provider: 'Microsoft Azure',
        category: 'male',
        gender: 'Male',
        accent: 'American',
        language: 'en-US',
        style: 'Deep bass, commercial & movie promo',
        description: 'Strong, deep, bass-rich tone suited for advertising and movie voiceovers.',
        isPremium: true,
        isActive: true,
        type: 'default'
      },
      {
        name: 'Luxury Podcast Voice',
        voiceName: 'Luxury Podcast Voice',
        voiceId: 'en-US-AvaNeural',
        provider: 'Microsoft Azure',
        category: 'female',
        gender: 'Female',
        accent: 'American',
        language: 'en-US',
        style: 'Sophisticated, smooth, luxury brand',
        description: 'Smooth, polished, and sophisticated female voice for luxury branding and podcasts.',
        isPremium: true,
        isActive: true,
        type: 'default'
      }
    ];

    const bulkOps = defaultVoices.map((v) => ({
      updateOne: {
        filter: { voiceId: v.voiceId },
        update: { $set: v },
        upsert: true
      }
    }));

    await Voice.bulkWrite(bulkOps);
    console.log('[Database] Successfully synchronized 13 default platform voices in MongoDB.');
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
