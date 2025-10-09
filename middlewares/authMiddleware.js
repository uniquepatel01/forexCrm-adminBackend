const jwt = require("jsonwebtoken");
const {
  connectCRM,
  getModel,
  connections,
} = require("../config/crmConnection");

const getAdminModel = require("../models/Admin");
const getAgentModel = require("../models/Agent");
const getSuperAdminModel = require("../models/SuperAdmin");
const getCRMTypeModel = require("../models/crmType");
const getStatusBucketModel = require("../models/CRMstatusBucket");

const protectSuperAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const SuperAdmin = getSuperAdminModel();
    const superAdmin = await SuperAdmin.findById(decoded.id).select(
      "-password"
    );

    if (!superAdmin) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    // Compare tokenVersion
    const currentVersion =
      typeof superAdmin.tokenVersion === "number" ? superAdmin.tokenVersion : 0;
    const tokenVersion =
      typeof decoded.version === "number" ? decoded.version : -1;

    if (tokenVersion !== currentVersion) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    // Attach to request
    req.superAdmin = superAdmin;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const protectAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Not authorized, no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 CASE 1: Admin token
    if (decoded.role === "admin") {
      const Admin = getAdminModel();
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) return res.status(401).json({ message: "Admin not found" });

      req.admin = admin;
      req.crmKey = admin.crmKey;
      req.role = "admin";

      // 🔹 CASE 2: Impersonated Super Admin token
    } else if (decoded.role === "superadmin") {
      // crmKey is embedded in impersonated token
      if (!decoded.crmKey) {
        return res.status(400).json({ message: "crmKey missing in token" });
      }

      req.admin = { id: decoded.id, name: decoded.name, role: "superadmin" };
      req.crmKey = decoded.crmKey;
    } else {
      return res.status(403).json({ message: "Invalid role" });
    }

    // ✅ Ensure CRM connection
    if (!connections[req.crmKey]) {
      const uri = process.env[`${req.crmKey.toUpperCase()}_URI`];
      if (!uri)
        return res.status(500).json({ message: `No DB URI for ${req.crmKey}` });
      await connectCRM(req.crmKey, uri);
    }

    req.CRMModel = getModel(req.crmKey);

    // ✅ Fetch dynamic bucket statuses for this CRM
    const CRMType = getCRMTypeModel();
    getStatusBucketModel(); // ensure model is registered
    const crmType = await CRMType.findOne({ crmKey: req.crmKey }).populate(
      "buckets"
    );

    if (!crmType) {
      req.STATUS_VALUES = [];
    } else {
      req.STATUS_VALUES = crmType.buckets.map((b) => b.bucketName);
    }

    // ✅ Normalization helpers
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");
    req.normalizedToActualStatus = req.STATUS_VALUES.reduce((map, s) => {
      map[normalize(s)] = s;
      return map;
    }, {});

    req.normalize = normalize;

    next();
  } catch (err) {
    console.error("🔥 protectAdmin error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const protectAgent = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Agent = getAgentModel(); // runtime fetch
    const agent = await Agent.findById(decoded.id).select("-password");

    if (!agent) return res.status(401).json({ message: "Not authorized" });

    const currentVersion =
      typeof agent.tokenVersion === "number" ? agent.tokenVersion : 0;
    const tokenVersion =
      typeof decoded.version === "number" ? decoded.version : -1;

    if (tokenVersion !== currentVersion) {
      console.warn("⚠️ Token version mismatch");
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    // 🔑 Connect to that CRM DB
    const crmKey = agent.crmKey;
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      if (!uri)
        return res
          .status(500)
          .json({ message: `No DB URI found for ${crmKey}` });
      await connectCRM(crmKey, uri);
    }

    // 🔑 Attach agent and CRM model
    req.agent = agent;
    req.crmKey = crmKey;
    req.CRMModel = getModel(crmKey);

    // ✅ Fetch dynamic bucket statuses for this CRM
    const CRMType = getCRMTypeModel();
    getStatusBucketModel(); // ensure model is registered
    const crmType = await CRMType.findOne({ crmKey: req.crmKey }).populate(
      "buckets"
    );

    if (!crmType) {
      req.STATUS_VALUES = [];
      req.crmBuckets = [];
    } else {
      req.STATUS_VALUES = crmType.buckets.map((b) => b.bucketName);
      req.crmBuckets = crmType.buckets.map((b) => ({
        bucketName: b.bucketName,
        bucketColor: b.bucketColor,
      }));
    }

    // ✅ Normalization helpers
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, "");
    req.normalizedToActualStatus = req.STATUS_VALUES.reduce((map, s) => {
      map[normalize(s)] = s;
      return map;
    }, {});

    req.normalize = normalize;

    next();
  } catch (err) {
    console.error("🔥 protectAgent error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const protectUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- Try Admin or SuperAdmin ---
    const Admin = getAdminModel();
    let user = null;

    if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Admin not found" });
      req.admin = user;
      req.crmKey = user.crmKey;
      req.role = "admin";

    } else if (decoded.role === "superadmin") {
      // SuperAdmin impersonating an admin
      if (!decoded.crmKey)
        return res.status(400).json({ message: "crmKey missing in token" });

      req.admin = { id: decoded.id, name: decoded.name, role: "superadmin" };
      req.crmKey = decoded.crmKey;
      req.role = "superadmin";
      req.superAdminImpersonating = true;

    } else {
      // Not admin or superadmin, try agent
      const Agent = getAgentModel();
      user = await Agent.findById(decoded.id).select("-password");
      if (!user) return res.status(401).json({ message: "Not authorized" });

      // Token version check for agents
      const currentVersion =
        typeof user.tokenVersion === "number" ? user.tokenVersion : 0;
      const tokenVersion =
        typeof decoded.version === "number" ? decoded.version : -1;

      if (tokenVersion !== currentVersion) {
        return res
          .status(401)
          .json({ message: "Session expired. Please login again." });
      }

      req.agent = user;
      req.crmKey = user.crmKey;
      req.userId = user._id;
    }

    // --- Ensure CRM connection ---
    if (!connections[req.crmKey]) {
      const uri = process.env[`${req.crmKey.toUpperCase()}_URI`];
      if (!uri)
        return res
          .status(500)
          .json({ message: `No DB URI found for ${req.crmKey}` });
      await connectCRM(req.crmKey, uri);
    }

    req.CRMModel = getModel(req.crmKey);
    next();
  } catch (err) {
    console.error("🔥 protectUser error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


module.exports = { protectAdmin, protectAgent, protectSuperAdmin, protectUser };
