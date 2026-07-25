const mongoose = require('mongoose');

// Set fallback DNS servers to resolve MongoDB Atlas SRV records reliably
try {
  require('dns').setServers(['1.1.1.1', '8.8.8.8']);
} catch (_) {}

let isConnected = false;

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
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000
    });
    isConnected = !!conn.connections[0].readyState;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    isConnected = false;
    throw error;
  }
};

module.exports = connectDB;
