const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menu.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/', authenticate, checkSubscription, ctrl.listMenu);
router.post('/', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.createMenu);
router.put('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.updateMenu);
router.delete('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.deleteMenu);

module.exports = router;
