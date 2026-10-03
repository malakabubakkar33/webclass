// Vercel Serverless Function entry point for SMIT LMS API Backend
const app = require('../backend/dist/app.js').default || require('../backend/dist/app.js');

module.exports = (req, res) => {
  // Extract and restore original URL if transparently rewritten by Vercel
  let originalUrl = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.url;
  if (originalUrl && typeof originalUrl === 'string' && originalUrl !== '/api' && originalUrl !== '/api/index') {
    const queryIndex = req.url ? req.url.indexOf('?') : -1;
    if (queryIndex !== -1 && !originalUrl.includes('?')) {
      originalUrl += req.url.substring(queryIndex);
    }
    req.url = originalUrl;
  }
  return app(req, res);
};
