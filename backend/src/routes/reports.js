const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/dashboard', authenticate, allowRoles(['admin','manager','superadmin']), checkSubscription, ctrl.dashboard);
router.get('/top-selling-items', authenticate, allowRoles(['admin','manager','superadmin']), checkSubscription, ctrl.getTopSellingItems);
router.get('/waiter-performance', authenticate, allowRoles(['admin','manager','superadmin']), checkSubscription, ctrl.getWaiterPerformance);
router.get('/order-trend', authenticate, allowRoles(['admin','manager','superadmin']), checkSubscription, ctrl.getOrderTrend);
router.get('/revenue-trend', authenticate, allowRoles(['admin','manager','superadmin']), checkSubscription, ctrl.getRevenueTrend);

module.exports = router;
