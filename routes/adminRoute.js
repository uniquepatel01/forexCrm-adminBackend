const express = require("express");
const router = express.Router();
const { loginAdmin, updateAdminProfile, logoutAdmin } = require("../controllers/adminController");
const { protectAdmin } = require("../middlewares/authMiddleware");

router.post("/login", loginAdmin);
router.put("/profile", protectAdmin, updateAdminProfile); // protected route

// Admin logout (client discards token)
router.post("/logout", protectAdmin, logoutAdmin);

module.exports = router;
