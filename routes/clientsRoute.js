const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middlewares/authMiddleware');
const {
    getTotalLeadsByStatus,
    getAllStatusCounts,
    getLeadsDetailsByStatus
} = require("../controllers/clientsController");

// Get all status counts in one request
router.get("/all",protectAdmin, getAllStatusCounts);

// Get details for a specific status
router.get("/details/:status",protectAdmin, getLeadsDetailsByStatus);

// Get count for specific status using parameter
router.get("/:status",protectAdmin, getTotalLeadsByStatus);

module.exports = router;