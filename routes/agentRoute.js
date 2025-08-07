const express = require("express");
const router = express.Router();
const { loginAgent, updateAgentProfile, registerAgent } = require("../controllers/agentController");
const {protectAgent} = require("../middlewares/authMiddleware");

// Agent registration
router.post("/register", registerAgent);

// Agent login
router.post("/login", loginAgent);
// Update agent profile (protected)
router.put("/profile", protectAgent, updateAgentProfile);

module.exports = router;