const getAdminModel = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Only Login Allowed
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const Admin = getAdminModel();

  const admin = await Admin.findOne({ email });
  if (!admin)
    return res.status(400).json({ message: "Invalid email or password" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: admin._id, crmKey: admin.crmKey, version: admin.tokenVersion || 0, role: "admin" },
    process.env.JWT_SECRET
  );
  res.json({
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, crmKey : admin.crmKey, role: admin.role },
  });
};

// Update profile
const updateAdminProfile = async (req, res) => {
  const Admin = getAdminModel();
  const admin = await Admin.findById(req.admin.id);
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const { name, email, password, mobile } = req.body;

  if (name) admin.name = name;
  if (email && email !== admin.email) {
    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });
    admin.email = email;
  }
  if (mobile) admin.mobile = mobile;
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    admin.password = hashed;
  }

  await admin.save();

  res.json({
    message: "Profile updated successfully",
    admin: { name: admin.name, email: admin.email, mobile: admin.mobile },
  });
};

// Logout admin: bump tokenVersion to invalidate all tokens
const logoutAdmin = async (req, res) => {
  const Admin = getAdminModel();

  const admin = await Admin.findById(req.admin.id);
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();
  res.json({ message: "Logged out successfully" });
};

// admin profile
const adminProfile = async (req, res) => {
  try {
    // `protectAdmin` middleware attaches the authenticated admin without password
    if (!req.admin) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.json(req.admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const Admin = getAdminModel();

    const admin = await Admin.find({}).select('-password'); // exclude password field
    res.json({admin});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { loginAdmin, updateAdminProfile, logoutAdmin, adminProfile, getAllAdmin };
