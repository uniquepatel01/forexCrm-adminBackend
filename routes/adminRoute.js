const express = require("express");
const router = express.Router();
const { loginAdmin, updateAdminProfile } = require("../controllers/adminController");
const protectAdmin = require("../middlewares/authMiddleware");

router.post("/login", loginAdmin);
router.put("/profile", protectAdmin, updateAdminProfile); // protected route

module.exports = router;
