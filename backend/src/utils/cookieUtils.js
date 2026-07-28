/**
 * Helper to generate cookie options for JWT authentication.
 * Production requires sameSite: 'none' and secure: true for cross-domain requests between frontend and backend.
 * Development uses sameSite: 'lax' and secure: false.
 */
const getCookieOptions = (overrideMaxAge) => {
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: overrideMaxAge !== undefined ? overrideMaxAge : 25 * 60 * 1000 // 25 minutes
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

module.exports = {
  getCookieOptions,
  getClearCookieOptions
};
