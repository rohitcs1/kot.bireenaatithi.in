const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/', authenticate, checkSubscription, ctrl.listNotifications);
router.put('/:id/read', authenticate, checkSubscription, ctrl.markRead);

module.exports = router;
