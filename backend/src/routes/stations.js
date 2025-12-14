const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stations.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

// List all stations
router.get('/', authenticate, checkSubscription, ctrl.listStations);

// Create a new station
router.post('/', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.createStation);

// Update a station
router.put('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.updateStation);

// Toggle station enabled/disabled status
router.patch('/:id/toggle', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.toggleStation);

// Delete a station
router.delete('/:id', authenticate, allowRoles(['admin','manager']), checkSubscription, ctrl.deleteStation);

module.exports = router;
