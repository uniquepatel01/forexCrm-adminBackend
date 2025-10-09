const express = require("express");
const router = express.Router();
const {
  addEntry,
  getAllLeads,
  getEntryById,
  updateEntry,
  deleteEntry,
  bulkUploadLeads,
  getBusinessTypesForLead, 
  getBusinessVolumesForLead 
} = require("../controllers/crmController");
const { protectAdmin, protectUser } = require("../middlewares/authMiddleware");

// Create a new entry
router.post("/",protectUser, addEntry);

router.get("/dropdown/business-types", protectUser, getBusinessTypesForLead);
router.get("/dropdown/business-volumes", protectUser, getBusinessVolumesForLead);

// Add Bulk entry
router.post("/add-bulk",protectAdmin, bulkUploadLeads);

// Get all leads
router.get("/", protectAdmin, getAllLeads);

// Get a single entry
router.get("/:id", protectAdmin, getEntryById);

// Update entry
router.put("/:id", protectAdmin, updateEntry);

// Delete entry
router.delete("/:id", protectAdmin, deleteEntry);

module.exports = router;
