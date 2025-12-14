const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.post('/', authenticate, allowRoles(['admin','manager','waiter']), checkSubscription, ctrl.createOrder);
router.get('/', authenticate, allowRoles(['admin','manager','waiter','kitchen']), checkSubscription, ctrl.listOrders);
// Allow waiter to mark orders as completed (serve) as well
router.put('/:id/status', authenticate, allowRoles(['admin','manager','kitchen','waiter']), checkSubscription, ctrl.updateOrderStatus);

module.exports = router;
