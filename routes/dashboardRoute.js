const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {
    getTotalLeads,
    getLeadsWithAgent,
    getTotalConverted,
    getConvertedWithAgent,
    getAllAnalytics
} = require('../controllers/dashboardController');

router.get('/total-leads', protectAdmin, getTotalLeads);
router.get('/leads-with-agent', protectAdmin, getLeadsWithAgent);
router.get('/total-converted', protectAdmin, getTotalConverted);
router.get('/converted-with-agent', protectAdmin, getConvertedWithAgent);
router.get('/all', protectAdmin, getAllAnalytics);

module.exports = router;