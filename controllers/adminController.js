const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Only Login Allowed
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(400).json({ message: 'Invalid email or password' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
};

// Update profile
const updateAdminProfile = async (req, res) => {
  const admin = await Admin.findById(req.admin.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });

  const { name, email, password } = req.body;

  if (name) admin.name = name;
  if (email) admin.email = email;
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    admin.password = hashed;
  }

  await admin.save();

  res.json({
    message: "Profile updated successfully",
    admin: { name: admin.name, email: admin.email },
  });
};

module.exports = { loginAdmin, updateAdminProfile };
