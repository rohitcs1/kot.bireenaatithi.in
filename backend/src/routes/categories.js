const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categories.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

router.get('/', authenticate, checkSubscription, ctrl.listCategories);
router.post('/', authenticate, allowRoles(['admin', 'manager']), checkSubscription, ctrl.createCategory);
router.put('/:id', authenticate, allowRoles(['admin', 'manager']), checkSubscription, ctrl.updateCategory);
router.delete('/:id', authenticate, allowRoles(['admin', 'manager']), checkSubscription, ctrl.deleteCategory);

module.exports = router;
