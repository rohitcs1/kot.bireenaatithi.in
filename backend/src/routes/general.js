const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const generalController = require('../controllers/general.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET general settings
router.get('/', authenticate, generalController.getGeneralSettings);

// PUT update general settings (admin/manager only)
router.put('/', authenticate, allowRoles(['admin', 'manager']), generalController.updateGeneralSettings);

// POST upload logo (admin/manager only)
router.post('/upload-logo', authenticate, allowRoles(['admin', 'manager']), upload.single('logo'), generalController.uploadLogo);

// DELETE logo (admin/manager only)
router.delete('/delete-logo', authenticate, allowRoles(['admin', 'manager']), generalController.deleteLogo);

module.exports = router;
