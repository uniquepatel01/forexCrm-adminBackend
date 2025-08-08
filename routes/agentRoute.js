const express = require("express");
const router = express.Router();
const { loginAgent, updateAgentProfile, registerAgent, blockAgent, unblockAgent, trashAgent, restoreAgent, getTrashedAgents } = require("../controllers/agentController");
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
router.put('/:id/restore', protectAdmin, restoreAgent);
router.get('/trash', protectAdmin, getTrashedAgents);

module.exports = router;