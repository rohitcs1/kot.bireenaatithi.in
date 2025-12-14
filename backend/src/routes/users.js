const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

// Create user (admin/manager/superadmin depending on rules)
router.post('/', authenticate, allowRoles(['admin','manager','superadmin']), ctrl.createUser);

// List users (admin and superadmin)
router.get('/', authenticate, allowRoles(['admin','superadmin']), ctrl.listUsers);

// Enable user
router.patch('/:id/enable', authenticate, allowRoles(['admin','superadmin']), (req, res) => {
  req.body.enabled = true;
  return ctrl.toggleUser(req, res);
});

// Disable user
router.patch('/:id/disable', authenticate, allowRoles(['admin','superadmin']), (req, res) => {
  req.body.enabled = false;
  return ctrl.toggleUser(req, res);
});

// Delete user
router.delete('/:id', authenticate, allowRoles(['admin','superadmin']), ctrl.deleteUser);

module.exports = router;
