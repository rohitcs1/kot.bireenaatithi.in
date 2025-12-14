const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/superadminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes here require superadmin
router.use(authenticate);
router.use((req, res, next) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Only superadmin' });
  next();
});

router.post('/hotels', ctrl.createHotel);
router.get('/hotels', ctrl.listHotels);
router.get('/overview', ctrl.overview);
router.patch('/hotels/:hotelId/status', ctrl.toggleHotelStatus);
router.delete('/hotels/:hotelId', ctrl.deleteHotel);
router.get('/hotels/:hotelId/staff', ctrl.listStaff);
router.patch('/staff/:userId/status', ctrl.toggleUser);
router.delete('/staff/:userId', ctrl.deleteUser);

module.exports = router;
