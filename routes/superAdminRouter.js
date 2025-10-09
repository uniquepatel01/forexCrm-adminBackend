const express = require("express");
const { superAdminLogin, registerAdmin, impersonateCRM } = require("../controllers/superAdminController");
const{getAllAdmin} = require("../controllers/adminController")
const{createOrUpdateCRMType, getMyCRMs} = require("../controllers/crmTypeController")
const {getbuckets, createBuckets, updateBucket} = require("../controllers/statusBucketController");
const {createBusinessType, fetchBusinessType} = require("../controllers/businessTypeController")
const { protectSuperAdmin } = require("../middlewares/authMiddleware");
const { createBusinessVolume, fetchBusinessVolume } = require("../controllers/businessVolumeController");

const router = express.Router();

router.post("/login", superAdminLogin); // SuperAdmin login
router.post("/register-admin", protectSuperAdmin, registerAdmin); // SuperAdmin creates Admin
router.post("/impersonate", protectSuperAdmin, impersonateCRM);
router.get("/get-admin", protectSuperAdmin, getAllAdmin);

// create crmType
router.post("/create-crm", protectSuperAdmin, createOrUpdateCRMType);

// get all CrmType
router.get("/crm-type", protectSuperAdmin, getMyCRMs);

// statusBucketRoute
router.get('/buckets', protectSuperAdmin, getbuckets);
router.post('/buckets', protectSuperAdmin, createBuckets);
router.put("/update/:bucketId", protectSuperAdmin, updateBucket);

//business Type Route

router.post('/create-business-type', protectSuperAdmin, createBusinessType);
router.get('/get-business-type', protectSuperAdmin, fetchBusinessType);

//business Volume Route

router.post('/create-business-volume', protectSuperAdmin, createBusinessVolume);
router.get('/get-business-volume', protectSuperAdmin, fetchBusinessVolume)






module.exports = router;
