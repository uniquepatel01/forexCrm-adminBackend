const getCRMTypeModel = require("../models/crmType");

exports.getDashboardData = async (req, res) => {
  try {
    const crmKey = req.admin?.crmKey || req.crmKey; // admin or superadmin
    const CRMType = getCRMTypeModel();

    // ✅ Fetch CRM config and populate buckets
    const crmConfig = await CRMType.findOne({ crmKey }).populate("buckets").lean();
    if (!crmConfig || !crmConfig.buckets) {
      return res.status(404).json({ message: "CRM config not found or no buckets defined" });
    }

    const bucketNames = crmConfig.buckets.map((b) => b.bucketName);

    // ✅ Aggregate lead counts for all buckets
    const results = await req.CRMModel.aggregate([
      { $match: { status: { $in: bucketNames } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } } // sort by descending count
    ]);

    // ✅ Pick top 4 buckets
    const topBuckets = results.slice(0, 4);

    // Transform into object with dynamic keys
    const data = {};
    topBuckets.forEach((r) => {
      const key = `${r._id.replace(/\s+/g, ' ').replace(/^./, c => c.toUpperCase())}`;
      data[key] = r.count;
    });

    res.json(data);
  } catch (err) {
    console.error("🔥 getDashboardData error:", err);
    res.status(500).json({ message: err.message });
  }
};


// dashbaord converted data


exports.getDashboardConverted = async (req, res) => {
  try {
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    // ✅ Check if "demo" bucket exists in CRM config
    const crmConfig = await CRMType.findOne({ crmKey }).populate("buckets").lean();
    if (
      !crmConfig ||
      !crmConfig.buckets.some(b => b.bucketName.toLowerCase() === "converted")
    ) {
      return res.status(404).json({ message: "Converted bucket not found in this CRM" });
    }

    const year = new Date().getFullYear();

    // ✅ Aggregate leads for demo bucket per month
    const results = await req.CRMModel.aggregate([
      {
        $match: {
          status: { $regex: /^converted$/i }, // case-insensitive match
          updatedAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$updatedAt" } },
          converted: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // ✅ Prepare response with all 12 months (even if 0 leads)
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyData = monthNames.map((name, index) => {
      const monthData = results.find(r => r._id.month === index + 1);
      return {
        month: name,
        converted: monthData ? monthData.converted : 0
      };
    });

    res.json({
      year,
      monthlyConverted: monthlyData
    });

  } catch (err) {
    console.error("🔥 getDashboardDemo error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getDashboardDemo = async (req, res) => {
  try {
    const crmKey = req.admin?.crmKey || req.crmKey;
    const CRMType = getCRMTypeModel();

    // ✅ Check if "demo" bucket exists in CRM config
    const crmConfig = await CRMType.findOne({ crmKey }).populate("buckets").lean();
    if (
      !crmConfig ||
      !crmConfig.buckets.some(b => b.bucketName.toLowerCase() === "demo")
    ) {
      return res.status(404).json({ message: "Demo bucket not found in this CRM" });
    }

    const year = new Date().getFullYear();

    // ✅ Aggregate leads for demo bucket per month
    const results = await req.CRMModel.aggregate([
      {
        $match: {
          status: { $regex: /^demo$/i }, // case-insensitive match
          updatedAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$updatedAt" } },
          Demo: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // ✅ Prepare response with all 12 months (even if 0 leads)
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyData = monthNames.map((name, index) => {
      const monthData = results.find(r => r._id.month === index + 1);
      return {
        month: name,
        Demo: monthData ? monthData.Demo : 0
      };
    });

    res.json({
      year,
      monthlyDemo: monthlyData
    });

  } catch (err) {
    console.error("🔥 getDashboardDemo error:", err);
    res.status(500).json({ message: err.message });
  }
};

