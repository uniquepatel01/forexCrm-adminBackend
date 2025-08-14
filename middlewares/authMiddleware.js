const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Agent = require("../models/Agent");

const protectAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(401).json({ message: "Not authorized" });
    const currentVersion = typeof admin.tokenVersion === 'number' ? admin.tokenVersion : 0;
    const tokenVersion = typeof decoded.version === 'number' ? decoded.version : -1;
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const protectAgent = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agent = await Agent.findById(decoded.id).select("-password");
    if (!agent) return res.status(401).json({ message: "Not authorized" });
    const currentVersion = typeof agent.tokenVersion === 'number' ? agent.tokenVersion : 0;
    const tokenVersion = typeof decoded.version === 'number' ? decoded.version : -1;
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    req.agent = agent;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = { protectAdmin, protectAgent };
