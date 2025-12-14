const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bills.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/:id', authenticate, allowRoles(['admin','manager','waiter']), checkSubscription, ctrl.getBill);
router.get('/', authenticate, allowRoles(['admin','manager','waiter']), checkSubscription, ctrl.listDraftBills);
router.post('/:id/pay', authenticate, allowRoles(['admin','manager','waiter']), checkSubscription, ctrl.payBill);

module.exports = router;
