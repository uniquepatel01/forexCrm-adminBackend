const express = require("express");
const router = express.Router();
const { loginAgent, updateAgentProfile, registerAgent, blockAgent, unblockAgent, trashAgent, getTrashedAgents, fetchLeadForAgent, getAgentLeads, getMyLeads } = require("../controllers/agentController");
const { protectAgent, protectAdmin } = require("../middlewares/authMiddleware");

// Agent registration
router.post("/register", registerAgent);

// Agent login
router.post("/login", loginAgent);

// Update agent profile (protected)
router.put("/profile", protectAgent, updateAgentProfile);

// Block/unblock agent (admin only)
router.put('/:id/block', protectAdmin, blockAgent);
router.put('/:id/unblock', protectAdmin, unblockAgent);

// Trash bin actions (admin only)
router.put('/:id/trash', protectAdmin, trashAgent);
router.get('/trash', protectAdmin, getTrashedAgents);

// Fetch a lead for the authenticated agent
router.post('/fetch-lead', protectAgent, fetchLeadForAgent);

// Get my assigned leads (agent)
router.get('/my-leads', protectAgent, getMyLeads);

// Admin: Get all leads of a specific agent
router.get('/:id/leads', protectAdmin, getAgentLeads);

module.exports = router;