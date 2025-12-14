const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hotels.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.post('/', authenticate, allowRoles(['superadmin']), ctrl.createHotel);
router.get('/', authenticate, allowRoles(['superadmin']), ctrl.listHotels);
router.put('/:id/toggle', authenticate, allowRoles(['superadmin']), ctrl.toggleHotel);

module.exports = router;
