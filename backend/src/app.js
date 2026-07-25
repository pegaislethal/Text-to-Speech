const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const routes = require('./routes');

const app = express();

// Security Headers: Disable Cross-Origin-Opener-Policy to prevent blocking Google OAuth popup postMessage
app.use(helmet({
  crossOriginOpenerPolicy: false
}));

// CORS Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://text-to-speech-theta-tawny.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/audio', express.static(path.join(__dirname, '../public/audio')));

// Routes
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
