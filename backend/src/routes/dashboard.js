const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getStats, getSalesTrend } = require('../controllers/dashboard.controller');

// Dashboard stats - authenticated users
router.get('/stats', authenticate, getStats);
router.get('/sales-trend', authenticate, getSalesTrend);

module.exports = router;
