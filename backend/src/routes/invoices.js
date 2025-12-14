const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/invoices.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.post('/', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.createInvoice);

module.exports = router;
