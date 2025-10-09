const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const SuperAdmin = require("../models/SuperAdmin"); // function
const Admin = require("../models/Admin"); // we’ll create this model
const { getMainConnection } = require("../config/mainDb");

// 🔑 SuperAdmin Login
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const SuperAdminModel = SuperAdmin();
    const superAdmin = await SuperAdminModel.findOne({ email });
    if (!superAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Embed tokenVersion in JWT
    const token = jwt.sign(
      { id: superAdmin._id, version: superAdmin.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      superAdmin: { id: superAdmin._id, email: superAdmin.email, role: superAdmin.role },
    });
  } catch (err) {
    console.error("🔥 Error in superAdminLogin:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 👨‍💼 Register Admin (SuperAdmin only)
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, crmKey } = req.body;

    if (!name || !email || !password || !crmKey) {
      return res.status(400).json({ message: "All fields required" });
    }

    const AdminModel = Admin();
    const existing = await AdminModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await AdminModel.create({
      name,
      email,
      password: hashedPassword,
      crmKey,
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: newAdmin._id, email: newAdmin.email, crmKey: newAdmin.crmKey },
    });
  } catch (err) {
    console.error("🔥 Error in registerAdmin:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.impersonateCRM = async (req, res) => {
  try {
    const superAdminId = req.superAdmin._id; // from protectSuperAdmin middleware
    const { crmKey } = req.body;

    if (!crmKey) {
      return res.status(400).json({ message: "crmKey required" });
    }

    const SuperAdminModel = SuperAdmin();
    // verify superadmin exists
    const superAdmin = await SuperAdminModel.findById(superAdminId);
    if (!superAdmin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ generate new token with crmKey like admin
    const token = jwt.sign(
      {
        id: superAdmin._id,
        role: "superadmin", // still superadmin, but with crmKey
        crmKey,
        version: superAdmin.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, crmKey });
  } catch (err) {
    console.error("🔥 impersonateCRM error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
