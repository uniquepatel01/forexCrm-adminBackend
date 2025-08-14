const express = require('express');
const router = express.Router();
const { protectAdmin, protectAgent } = require('../middlewares/authMiddleware');
const {
    getTotalLeadsByStatus,
    getAllStatusCounts
} = require("../controllers/clientsController");

// Get all status counts in one request
router.get("/all", getAllStatusCounts);

// Get count for specific status using parameter
router.get("/:status", getTotalLeadsByStatus);

module.exports = router;