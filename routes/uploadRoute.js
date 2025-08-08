const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const { uploadCSV, upload } = require('../controllers/uploadController');

// CSV upload route (admin only)
router.post('/csv', protectAdmin, upload, uploadCSV);

module.exports = router; 