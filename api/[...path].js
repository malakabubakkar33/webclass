// Vercel Serverless Function catch-all route for SMIT LMS API Backend
const handler = require('./index.js');

module.exports = (req, res) => {
  return handler(req, res);
};
