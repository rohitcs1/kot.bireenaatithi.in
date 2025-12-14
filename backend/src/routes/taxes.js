const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const taxesController = require('../controllers/taxes.controller');

// GET tax settings
router.get('/', authenticate, taxesController.getTaxSettings);

// POST/PUT tax settings (save)
router.post('/save', authenticate, allowRoles(['admin', 'manager']), taxesController.saveTaxSettings);

module.exports = router;
