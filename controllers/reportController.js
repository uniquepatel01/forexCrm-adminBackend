const getCRMTypeModel = require("../models/crmType");
const mongoose = require("mongoose");
//----------------------------For Report and analytic Sectioin----------------------

// Get today's report

// Get today's report (dynamic buckets)
exports.getTodayReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    // 🔹 Fetch CRM config with buckets
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();
    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    // 🔹 Build regex array for totalLeads (case-insensitive match for all buckets)
    const bucketRegexArray = crmConfig.buckets.map(
      (b) => new RegExp(`^${b.bucketName}$`, "i")
    );

    // 🔹 Count all leads updated today (any bucket)
    const totalLeads = await req.CRMModel.countDocuments({
      updatedAt: { $gte: today, $lt: tomorrow },
      status: { $in: bucketRegexArray },
    });

    // 🔹 Convert to array of buckets
    const buckets = [];
    for (const bucket of crmConfig.buckets) {
      const bucketName = bucket.bucketName;
      const bucketColor = bucket.bucketColor
      const count = await req.CRMModel.countDocuments({
        status: { $regex: new RegExp(`^${bucketName}$`, "i") },
        updatedAt: { $gte: today, $lt: tomorrow },
      });
      buckets.push({
        name: bucketName,
        color: bucketColor,
        count,
      });
    }

    res.json({
      period: "Today",
      date: today.toISOString().split("T")[0],
      totalLeads,
      buckets,
    });
  } catch (err) {
    console.error("🔥 getTodayReport error:", err);
    res.status(500).json({ message: err.message });
  }
};


// Get weekly report (dynamic buckets as array)
exports.getWeeklyReport = async (req, res) => {
  try {
    const today = new Date();

    // Start of current week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    // 🔹 Fetch CRM config with buckets
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    let days = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const total = await req.CRMModel.countDocuments({
        updatedAt: { $gte: dayStart, $lte: dayEnd },
        status: { $in: bucketNames.map((b) => new RegExp(`^${b}$`, "i")) },
      });

      // 🔹 buckets as array
      const buckets = await Promise.all(
        bucketNames.map(async (bucket) => {
          const count = await req.CRMModel.countDocuments({
            status: { $regex: new RegExp(`^${bucket}$`, "i") },
            updatedAt: { $gte: dayStart, $lte: dayEnd },
          });
          return { name: bucket, count };
        })
      );

      days.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "long" }),
        total,
        buckets, // 👈 array
      });
    }

    res.json({
      week: `${startOfWeek.toDateString()} - ${endOfWeek.toDateString()}`,
      days,
    });
  } catch (err) {
    console.error("🔥 getWeeklyReport error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get monthly report (dynamic buckets as array)
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month: queryMonth, year: queryYear } = req.query;
    const today = new Date();

    // If query not provided → fallback to current month/year
    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();
    const month = queryMonth ? parseInt(queryMonth, 10) - 1 : today.getMonth(); // 0-based month

    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Find the Monday of the week containing the startOfMonth
    const firstWeekStart = new Date(startOfMonth);
    firstWeekStart.setDate(
      firstWeekStart.getDate() - ((firstWeekStart.getDay() + 6) % 7)
    ); // back to Monday

    // 🔹 Fetch buckets dynamically
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();
    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    const weeks = [];
    let weekIndex = 1;
    let current = new Date(firstWeekStart);

    while (current <= endOfMonth) {
      const weekStart = new Date(current);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Clamp to month boundaries
      const effectiveStart =
        weekStart < startOfMonth ? startOfMonth : weekStart;
      const effectiveEnd = weekEnd > endOfMonth ? endOfMonth : weekEnd;

      // 🔹 Aggregate counts per bucket (case-insensitive)
      const results = await req.CRMModel.aggregate([
        {
          $match: {
            updatedAt: { $gte: effectiveStart, $lte: effectiveEnd },
            status: { $in: bucketNames.map((b) => new RegExp(`^${b}$`, "i")) },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // 🔹 Convert into array of buckets
      const buckets = bucketNames.map((bucket) => {
        const found = results.find(
          (r) => r._id.toLowerCase() === bucket.toLowerCase()
        );
        return { name: bucket, count: found ? found.count : 0 };
      });

      const totalLeads = buckets.reduce((a, b) => a + b.count, 0);

      weeks.push({
        week: `Week${weekIndex}`,
        startDate: effectiveStart.toISOString().split("T")[0],
        endDate: effectiveEnd.toISOString().split("T")[0],
        totalLeads,
        buckets, // 👈 array now
      });

      // move to next week
      current.setDate(current.getDate() + 7);
      weekIndex++;
    }

    res.json({
      period:
        queryMonth && queryYear
          ? `${startOfMonth.toLocaleString("default", {
              month: "long",
            })} ${year}`
          : "This Month",
      month: startOfMonth.toLocaleString("default", { month: "long" }),
      year,
      weeks,
    });
  } catch (err) {
    console.error("🔥 getMonthlyReport error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get yearly report
exports.getYearlyReport = async (req, res) => {
  try {
    const { year: queryYear } = req.query;
    const today = new Date();
    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // 🔹 Fetch buckets dynamically
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    const months = [];

    for (let m = 0; m < 12; m++) {
      const startOfMonth = new Date(year, m, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);

      // 🔹 Aggregate counts per bucket (case-insensitive)
      const results = await req.CRMModel.aggregate([
        {
          $match: {
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: bucketNames.map((b) => new RegExp(`^${b}$`, "i")) },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // 🔹 Convert to array of buckets
      const buckets = bucketNames.map((bucket) => {
        const found = results.find(
          (r) => r._id.toLowerCase() === bucket.toLowerCase()
        );
        return {
          name: bucket,
          count: found ? found.count : 0,
        };
      });

      const totalLeads = buckets.reduce((sum, b) => sum + b.count, 0);

      months.push({
        month: monthNames[m],
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
        totalLeads,
        buckets,
      });
    }

    res.json({
      period: queryYear ? `Year ${year}` : "This Year",
      year,
      months,
    });
  } catch (err) {
    console.error("🔥 getYearlyReport error:", err);
    res.status(500).json({ message: err.message });
  }
};







// ---------------- Agent-specific reports ----------------
// camelCase key builder: "call me later" -> "callMeLater"
const toKey = (s) => {
  if (!s) return "";
  const parts = s.toLowerCase().trim().split(/\s+/);
  return parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
};

async function getCountsForRangeAndAgent(req, range, agentId) {
  // filter by agent if provided
  const assignedFilter = agentId
    ? { assignedTo: new mongoose.Types.ObjectId(agentId) }
    : {};

  // aggregation match
  const match = {
    ...assignedFilter,
    updatedAt: range, // e.g. { $gte, $lt }
  };

  // single aggregation
  const agg = [
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ];

  const results = await req.CRMModel.aggregate(agg);

  // normalize results into a map
  const statusMap = {};
  for (const r of results) {
    const norm = req.normalize(r._id || "");
    if (!norm) continue;
    statusMap[norm] = (statusMap[norm] || 0) + r.count;
  }

  // now prepare output
  const counts = { totalLeads: 0 };
  for (const actual of req.STATUS_VALUES) {
    const norm = req.normalize(actual);
    const key = toKey(actual);
    const cnt = statusMap[norm] || 0;
    counts[key] = cnt;
    counts.totalLeads += cnt;
  }

  return counts;
}

exports.getTodayReportForAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // 🔹 Fetch CRM buckets
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();
    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    // 🔹 Total leads for agent today
    const totalLeads = await req.CRMModel.countDocuments({
      assignedTo: String(id),
      updatedAt: { $gte: start, $lt: end },
    });

    // 🔹 Build buckets array
    const buckets = [];
    for (const bucket of crmConfig.buckets) {
      const bucketName = bucket.bucketName;
      const count = await req.CRMModel.countDocuments({
        assignedTo: String(id),
        status: { $regex: new RegExp(`^${bucketName}$`, "i") },
        updatedAt: { $gte: start, $lt: end },
      });
      buckets.push({
        name: bucketName,
        count,
      });
    }

    res.json({
      period: "Today",
      date: start.toISOString().split("T")[0],
      agentId: id,
      totalLeads,
      buckets,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeeklyReportForAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();

    // Start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 🔹 Fetch CRM buckets dynamically
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();
    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      let totalLeads = 0;
      const buckets = [];

      // 🔹 Count per bucket for this agent
      for (const bucketName of bucketNames) {
        const count = await req.CRMModel.countDocuments({
          assignedTo: String(id),
          status: { $regex: new RegExp(`^${bucketName}$`, "i") },
          updatedAt: { $gte: dayStart, $lte: dayEnd },
        });

        totalLeads += count;
        buckets.push({
          name: bucketName,
          count,
        });
      }

      days.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "long" }),
        date: dayStart.toISOString().split("T")[0],
        totalLeads,
        buckets,
      });
    }

    res.json({
      period: "This Week",
      startDate: startOfWeek.toISOString().split("T")[0],
      endDate: endOfWeek.toISOString().split("T")[0],
      agentId: id,
      days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMonthlyReportForAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;
    const today = new Date();

    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();
    const month = queryMonth ? parseInt(queryMonth, 10) - 1 : today.getMonth(); // 0-based

    // Month boundaries
    const startOfMonth = new Date(year, month, 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(year, month + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // 🔹 Fetch CRM buckets dynamically
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    let weeks = [];
    let weekStart = new Date(startOfMonth);
    let weekIndex = 1;

    while (weekStart <= endOfMonth) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Don’t cross month boundary
      if (weekEnd > endOfMonth) {
        weekEnd.setTime(endOfMonth.getTime());
      }

      let totalLeads = 0;
      const buckets = [];

      // 🔹 Count per bucket for this agent
      for (const bucketName of bucketNames) {
        const count = await req.CRMModel.countDocuments({
          assignedTo: String(id),
          status: { $regex: new RegExp(`^${bucketName}$`, "i") },
          updatedAt: { $gte: weekStart, $lte: weekEnd },
        });

        totalLeads += count;
        buckets.push({
          name: bucketName,
          count,
        });
      }

      weeks.push({
        week: `Week ${weekIndex}`,
        startDate: weekStart.toISOString().split("T")[0],
        endDate: weekEnd.toISOString().split("T")[0],
        totalLeads,
        buckets,
      });

      // Move to next week
      weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() + 1);
      weekStart.setHours(0, 0, 0, 0);
      weekIndex++;
    }

    res.json({
      period:
        queryMonth && queryYear
          ? `${startOfMonth.toLocaleString("default", { month: "long" })} ${year}`
          : "This Month",
      month: startOfMonth.toLocaleString("default", { month: "long" }),
      year,
      agentId: id,
      weeks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getYearlyReportForAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { year: queryYear } = req.query;
    const today = new Date();
    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();

    const startOfYear = new Date(year, 0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // 🔹 Fetch CRM buckets dynamically
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();
    const crmConfig = await CRMType.findOne({ crmKey })
      .populate("buckets")
      .lean();

    if (!crmConfig || !crmConfig.buckets.length) {
      return res.status(404).json({ message: "No buckets found for this CRM" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(year, month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      let totalLeads = 0;
      const buckets = [];

      // 🔹 Count per bucket for this agent
      for (const bucketName of bucketNames) {
        const count = await req.CRMModel.countDocuments({
          assignedTo: String(id),
          status: { $regex: new RegExp(`^${bucketName}$`, "i") },
          updatedAt: { $gte: monthStart, $lte: monthEnd },
        });

        totalLeads += count;
        buckets.push({
          name: bucketName,
          count,
        });
      }

      months.push({
        month: monthStart.toLocaleString("default", { month: "long" }),
        startDate: monthStart.toISOString().split("T")[0],
        endDate: monthEnd.toISOString().split("T")[0],
        totalLeads,
        buckets,
      });
    }

    res.json({
      period: queryYear ? `Year ${year}` : "This Year",
      year,
      agentId: id,
      months,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ---------------- Agent-specific detailed leads (not just counts) ----------------

exports.getTodayAgentLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const leads = await req.CRMModel.find({
      assignedTo: String(id),
      updatedAt: { $gte: start, $lt: end },
    }).lean().sort({ updatedAt: -1 });
    res.json({
      period: "Today",
      date: start.toISOString().split("T")[0],
      agentId: id,
      total: leads.length,
      leads,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWeeklyAgentLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();

    // Start of this week (Sunday as 0, so shift to Monday if needed)
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    // Days of week labels
    const dayLabels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const days = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const leads = await req.CRMModel.find({
        assignedTo: String(id),
        updatedAt: { $gte: dayStart, $lt: dayEnd },
      }).lean().sort({ updatedAt: -1 });
      days.push({
        day: dayLabels[dayStart.getDay()],
        date: dayStart.toISOString().split("T")[0],
        total: leads.length,
        leads,
      });
    }

    res.json({
      period: "This Week",
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      agentId: id,
      days,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMonthlyAgentLeadsByWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;
    const today = new Date();

    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();
    const month = queryMonth ? parseInt(queryMonth, 10) - 1 : today.getMonth(); // 0-based
    const startOfMonth = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();

    const weekRanges = [
      {
        label: "week1",
        start: new Date(year, month, 1),
        end: new Date(year, month, Math.min(7, lastDay) + 1),
      },
      {
        label: "week2",
        start: new Date(year, month, 8),
        end: new Date(year, month, Math.min(14, lastDay) + 1),
      },
      {
        label: "week3",
        start: new Date(year, month, 15),
        end: new Date(year, month, Math.min(21, lastDay) + 1),
      },
      {
        label: "week4",
        start: new Date(year, month, 22),
        end: new Date(year, month, Math.min(28, lastDay) + 1),
      },
      {
        label: "week5",
        start: new Date(year, month, 29),
        end: new Date(year, month + 1, 1),
      },
    ];

    const weeks = [];
    for (const { label, start, end } of weekRanges) {
      if (start.getMonth() !== month || start.getDate() > lastDay) {
        weeks[label] = { total: 0, leads: [] };
        continue;
      }
      const leads = await req.CRMModel.find({
        assignedTo: String(id),
        updatedAt: { $gte: start, $lt: end },
      }).lean().sort({ updatedAt: -1 });

      weeks.push({ week: label, total: leads.length, leads });
    }

    res.json({
      period:
        queryMonth && queryYear
          ? `${startOfMonth.toLocaleString("default", {
              month: "long",
            })} ${year}`
          : "This Month",
      month: startOfMonth.toLocaleString("default", { month: "long" }),
      year,
      agentId: id,
      weeks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getYearlyAgentLeadsByMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const { year: queryYear } = req.query;
    const today = new Date();
    const year = queryYear ? parseInt(queryYear, 10) : today.getFullYear();

    const months = [];

    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const leads = await req.CRMModel.find({
        assignedTo: String(id),
        updatedAt: { $gte: start, $lt: end },
      }).lean().sort({ updatedAt: -1 });

      months.push({
        month: start.toLocaleString("default", { month: "long" }), // e.g. January
        // short: start.toLocaleString('default', { month: 'short' }), // e.g. Jan
        total: leads.length,
        leads,
      });
    }

    res.json({
      period: queryYear ? `Year ${year}` : "This Year",
      year,
      agentId: id,
      months,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
