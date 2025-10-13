const Agent = require("../models/Agent");
// const Forex = require("../models/crmModel");
const {
  getModel,
  connectCRM,
  connections,
} = require("../config/crmConnection");
const getCRMTypeModel = require("../models/crmType");

exports.getCrmName = async (req, res) => {
  try {
    const crmKey = req.agent.crmKey;
    res.status(200).json({ crmKey });
  } catch (err) {
    console.error("Error fetching CRM name:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getCrmBuckets = async (req, res) => {
  try {
    return res.status(200).json({
      buckets: req.STATUS_VALUES || [],
      total: (req.crmBuckets || []).length,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch buckets",
    });
  }
};

// fetch and assign lead to agent
exports.fetchLead = async (req, res) => {
  const agentId = req.agent._id;
  const crmKey = req.agent.crmKey;

  try {
    // Ensure CRM connection exists
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      await connectCRM(crmKey, uri);
    }

    const CRM = getModel(crmKey); // Safe model retrieval

    const lead = await CRM.findOneAndUpdate(
      { assignedTo: null, status: "" },
      { $set: { assignedTo: agentId } },
      { new: true }
    );

    if (!lead)
      return res.status(400).json({ message: "No unassigned leads left" });

    res.status(200).json({ assignedLead: lead });
  } catch (error) {
    console.error("fetchLead error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.UpdateLeadStatus = async (req, res) => {
  const { leadId, bucketName } = req.body;
  if (!leadId || !bucketName) {
    return res.status(400).json({ message: "leadId and bucketName required" });
  }

  try {
    const agentId = req.agent._id;
    const crmKey = req.agent.crmKey;

    const CRM = getModel(crmKey);
    const CRMType = getCRMTypeModel();

    // ✅ Populate bucket docs
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig) {
      return res.status(404).json({ message: "CRM config not found" });
    }

    // 🔹 Normalize helper
    const normalize = (s) => (s ? s.toLowerCase().replace(/\s+/g, "") : "");

    // 🔹 Build normalized map { "didnotpick": "Did not Pick" }
    const normalizedMap = {};
    crmConfig.buckets.forEach((b) => {
      if (b.bucketName) {
        normalizedMap[normalize(b.bucketName)] = b.bucketName;
      }
    });

    const normalizedStatus = normalize(bucketName);
    const actualStatus = normalizedMap[normalizedStatus];

    if (!actualStatus) {
      return res.status(400).json({
        message: "Invalid bucket for this CRM",
        validBuckets: crmConfig.buckets.map((b) => b.bucketName),
      });
    }

    // ✅ Update lead
    const updateLead = await CRM.findOneAndUpdate(
      { assignedTo: agentId, _id: leadId },
      { $set: { status: actualStatus, updatedAt: new Date() } },
      { new: true }
    );

    if (!updateLead) {
      return res
        .status(400)
        .json({ message: "Lead not found or not assigned to this user" });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead: updateLead,
    });
  } catch (err) {
    console.error("error updating lead", err);
    res.status(500).json({ message: "server error" });
  }
};

// Add remarks
exports.AddRemarks = async (req, res) => {
  const { leadId, remark = "No remarks added" } = req.body;

  if (!leadId) {
    return res.status(400).json({ message: "leadId required" });
  }

  try {
    const agentId = req.agent._id;
    const crmKey = req.agent.crmKey;

    // Ensure CRM connection exists
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      await connectCRM(crmKey, uri);
    }

    const CRM = getModel(crmKey);

    const updateLead = await CRM.findOneAndUpdate(
      { _id: leadId, assignedTo: agentId },
      {
        $push: {
          Remarks: {
            $each: [{ comment: remark, date: new Date() }],
            $position: 0,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updateLead) {
      return res
        .status(400)
        .json({ message: "Lead not found or not assigned to this user." });
    }

    res.status(200).json({ message: "Remark added", updateLead });
  } catch (err) {
    console.error("🔥 Error in AddRemarks:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// agent Dashboard for leads data

exports.AgentDashboard = async (req, res) => {
  try {
    const agentId = req.agent?._id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized: No agent found" });
    }

    const crmKey = req.agent.crmKey;

    // Ensure CRM connection exists
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      await connectCRM(crmKey, uri);
    }

    const CRM = getModel(crmKey);
    const CRMType = getCRMTypeModel();

    // ✅ Fetch CRM buckets dynamically
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig) {
      return res.status(404).json({ message: "CRM config not found" });
    }

    // 🔹 Normalize helper
    const normalize = (s) => (s ? s.toLowerCase().replace(/\s+/g, "") : "");

    // 🔹 Build normalized map for buckets
    const normalizedBuckets = {};
    crmConfig.buckets.forEach((b) => {
      if (b.bucketName)
        normalizedBuckets[normalize(b.bucketName)] = b.bucketName;
    });

    // ✅ Initialize grouped object with bucket names only
    const grouped = {};
    Object.values(normalizedBuckets).forEach((name) => (grouped[name] = []));

    // ✅ Fetch all leads assigned to this agent
    const allLeads = await CRM.find({ assignedTo: agentId }).lean();

    // ✅ Only include leads whose status matches a valid bucket
    allLeads.forEach((lead) => {
      const leadNorm = normalize(lead.status);
      if (normalizedBuckets[leadNorm]) {
        grouped[normalizedBuckets[leadNorm]].unshift(lead);
      }
    });

    res.status(200).json(grouped);
  } catch (err) {
    console.error("🔥 Error in AgentDashboard:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Search Leads or companies with auth
exports.SearchLeads = async (req, res) => {
  try {
    const { q } = req.query;
    const agentId = req.agent._id;
    const crmKey = req.agent.crmKey;

    if (!q) return res.status(400).json({ message: "Query is required" });

    // Ensure CRM connection exists
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      await connectCRM(crmKey, uri);
    }

    const CRM = getModel(crmKey);

    // Create regex for partial match anywhere, case-insensitive
    const regex = new RegExp(q, "i");

    const result = await CRM.find({
      assignedTo: agentId,
      $or: [{ Company_name: regex }, { Mobile_no: regex }],
    })
      .select("Company_name status Mobile_no")
      .limit(10)
      .lean();

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in searching leads:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Search lead by Id
exports.leadId = async (req, res) => {
  const { id } = req.params;
  const crmKey = req.agent.crmKey;

  try {
    // Ensure CRM connection exists
    if (!connections[crmKey]) {
      const uri = process.env[`${crmKey.toUpperCase()}_URI`];
      await connectCRM(crmKey, uri);
    }

    const CRM = getModel(crmKey);

    const lead = await CRM.findById(id);
    if (!lead) return res.status(400).json({ message: "Lead not found" });

    res.status(200).json(lead);
  } catch (err) {
    console.error("Error fetching lead by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// report for agent apk

// controllers/analyticsController.js

// helper: calculate date range
const getDateRange = (type) => {
  const today = new Date();

  if (type === "daily") {
    today.setHours(0, 0, 0, 0);
    return { $gte: today };
  } else if (type === "weekly") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return { $gte: startOfWeek };
  } else if (type === "monthly") {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { $gte: startOfMonth };
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const agentId = req.agent._id;

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const periods = ["daily", "weekly", "monthly"];
    const results = {};

    const crmKey = req.agent.crmKey;
    const CRM = getModel(crmKey);

    for (const period of periods) {
      const range = getDateRange(period);

      // ✅ Step 1: Aggregate status counts
      const statusCounts = await CRM.aggregate([
        { $match: { assignedTo: agentId, updatedAt: range } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Convert to {status: count}
      const countsMap = {};
      statusCounts.forEach((s) => {
        countsMap[s._id] = s.count;
      });

      // ✅ Step 2: Sort by count desc
      const sorted = Object.entries(countsMap).sort((a, b) => b[1] - a[1]);

      // ✅ Step 3: Take top 2
      const top2 = sorted.slice(0, 2);

      // ✅ Step 4: Sum the rest as "others"
      const others = sorted.slice(2).reduce((acc, [, count]) => acc + count, 0);

      // ✅ Build result
      const periodResult = {};
      top2.forEach(([status, count]) => {
        periodResult[status] = count;
      });
      if (others > 0) {
        periodResult["others"] = others;
      }

      results[period] = periodResult;
    }

    return res.status(200).json({
      message: "Analytics fetched successfully",
      agentId,
      results,
    });
  } catch (err) {
    console.error("Error fetching analytics", err);
    return res.status(500).json({ message: "Server error" });
  }
};
