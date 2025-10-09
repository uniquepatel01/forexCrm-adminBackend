const express = require("express");
const router = express.Router();
const { loginAdmin, updateAdminProfile, logoutAdmin, adminProfile, getAllAdmin} = require("../controllers/adminController");
const { protectAdmin, protectSuperAdmin } = require("../middlewares/authMiddleware");

router.post("/login", loginAdmin);
router.get("/profile", protectAdmin, adminProfile); // protected route
router.put("/updateProfile", protectAdmin, updateAdminProfile)
// Admin logout (client discards token)
router.post("/logout", protectAdmin, logoutAdmin);

module.exports = router;
