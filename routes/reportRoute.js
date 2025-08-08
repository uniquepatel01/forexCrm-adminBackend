const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {
    getTodayReport,
    getWeeklyReport,
    getMonthlyReport,
    getYearlyReport
} = require('../controllers/reportController');

router.get('/today', protectAdmin, getTodayReport);
router.get('/weekly', protectAdmin, getWeeklyReport);
router.get('/monthly', protectAdmin, getMonthlyReport);
router.get('/yearly', protectAdmin, getYearlyReport);

module.exports = router; 