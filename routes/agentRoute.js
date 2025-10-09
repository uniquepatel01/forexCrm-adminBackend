const express = require("express");
const router = express.Router();
const { loginAgent, updateAgentProfile, registerAgent, blockAgent, unblockAgent, trashAgent, getTrashedAgents, fetchLeadForAgent, getAgentLeads, getMyLeads, getAllAgent, getAgent, getBlockAgent } = require("../controllers/agentController");
const { protectAgent, protectAdmin, protectUser } = require("../middlewares/authMiddleware");

// Agent registration
router.post("/register",protectAdmin, registerAgent);

// Agent login
router.post("/login", loginAgent);

// Update agent profile (protected)
router.put("/update", protectUser, updateAgentProfile);
router.put ("/update/:id", protectUser, updateAgentProfile )

// Block/unblock agent (admin only)
router.put('/:id/block', protectAdmin, blockAgent);
router.put('/:id/unblock', protectAdmin, unblockAgent);
router.get('/block', protectAdmin, getBlockAgent)

// Trash bin actions (admin only)
router.put('/:id/trash', protectAdmin, trashAgent);
router.get('/trash', protectAdmin, getTrashedAgents);



// Get my assigned leads (agent) /// solver later for protect side to join database 
router.get('/my-leads', protectAgent, getMyLeads);

// Admin: Get all leads of a specific agent
router.get('/:id/leads', protectAdmin, getAgentLeads);

// Get all Agent
router.get('/allagent', protectAdmin,getAllAgent )

// get specific agent

router.get('/:id',protectUser, getAgent)

module.exports = router;