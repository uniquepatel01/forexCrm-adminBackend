const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {getDashboardData, getDashboardConverted, getDashboardDemo} = require('../controllers/dashboardController');

router.get('/dashboard-data', protectAdmin, getDashboardData);
router.get('/dashboard-converted', protectAdmin, getDashboardConverted);
router.get('/dashboard-demo', protectAdmin, getDashboardDemo)


module.exports = router;