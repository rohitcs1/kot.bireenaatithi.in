const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function sign(payload, opts = { expiresIn: '1d' }) {
  return jwt.sign(payload, JWT_SECRET, opts);
}

function verify(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { sign, verify };
