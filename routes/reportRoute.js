const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {
    getTodayReport,
    getWeeklyReport,
    getMonthlyReport,
    getYearlyReport,
    getTodayReportForAgent,
    getWeeklyReportForAgent,
    getMonthlyReportForAgent,
    getYearlyReportForAgent,
    getTodayAgentLeads,
    getWeeklyAgentLeads,
    getMonthlyAgentLeadsByWeek,
    getYearlyAgentLeadsByMonth
} = require('../controllers/reportController');

router.get('/today', protectAdmin, getTodayReport);
router.get('/weekly', protectAdmin, getWeeklyReport);
router.get('/monthly', protectAdmin, getMonthlyReport);
router.get('/yearly', protectAdmin, getYearlyReport);

// Agent-specific reports (admin-only)
router.get('/today/agent/:id', protectAdmin, getTodayReportForAgent);
router.get('/weekly/agent/:id', protectAdmin, getWeeklyReportForAgent);
router.get('/monthly/agent/:id', protectAdmin, getMonthlyReportForAgent);
router.get('/yearly/agent/:id', protectAdmin, getYearlyReportForAgent);

// Agent detailed leads (admin-only)
router.get('/today/agent/:id/leads', protectAdmin, getTodayAgentLeads);
router.get('/weekly/agent/:id/leads', protectAdmin, getWeeklyAgentLeads);
router.get('/monthly/agent/:id/leads', protectAdmin, getMonthlyAgentLeadsByWeek);
router.get('/yearly/agent/:id/leads', protectAdmin, getYearlyAgentLeadsByMonth);

module.exports = router; 