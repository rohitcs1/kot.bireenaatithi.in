const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tables.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/', authenticate, checkSubscription, ctrl.listTables);
router.post('/', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.createTable);
router.put('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.updateTable);
router.delete('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.deleteTable);

module.exports = router;
