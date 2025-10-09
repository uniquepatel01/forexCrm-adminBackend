const express = require('express');
const router = express.Router();
const { protectAgent } = require("../middlewares/authMiddleware");

const {fetchLead,UpdateLeadStatus,AddRemarks, AgentDashboard, SearchLeads, leadId, getAnalytics, getCrmName,getCrmBuckets} = require("../appController/apkController")

router.get('/crm-name', protectAgent, getCrmName);
router.get('/buckets', protectAgent, getCrmBuckets)
router.put('/fetch-lead',protectAgent, fetchLead);
router.put('/update-status',protectAgent, UpdateLeadStatus);
router.put('/add-remarks',protectAgent, AddRemarks);
router.get('/leads',protectAgent, AgentDashboard)
router.get('/search-lead',protectAgent, SearchLeads);
router.get('/lead/:id',protectAgent, leadId);

router.get('/get-analytics', protectAgent, getAnalytics);

module.exports = router;