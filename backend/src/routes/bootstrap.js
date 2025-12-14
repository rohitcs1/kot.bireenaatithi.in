const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bootstrap.controller');

// This route is intentionally minimal and protected by an admin secret header
// POST /bootstrap/superadmin { email, password, name }
router.post('/superadmin', ctrl.createSuperadmin);

module.exports = router;
