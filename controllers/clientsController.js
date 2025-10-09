

// Generic function to get total leads by status
exports.getTotalLeadsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const actualStatus = req.normalizedToActualStatus[req.normalize(status)];

    if (!actualStatus) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses: req.STATUS_VALUES,
      });
    }

    const count = await req.CRMModel.countDocuments({ status: actualStatus });

    const base = actualStatus.replace(/\s+/g, "");
    const responseKey = `${base.charAt(0).toUpperCase() + base.slice(1)}`;
    res.json({ [responseKey]: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get all status counts in a single request
exports.getAllStatusCounts = async (req, res) => {
  try {
    const counts = {};
    for (const status of req.STATUS_VALUES) {
      const count = await req.CRMModel.countDocuments({ status });
      const base = status.replace(/\s+/g, " ");
      const responseKey = `${base.charAt(0).toUpperCase() + base.slice(1)}`;
      counts[responseKey] = count;
    }
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getLeadsDetailsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { agentId } = req.query;

    const actualStatus = req.normalizedToActualStatus[req.normalize(status)];

    if (!actualStatus) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses: req.STATUS_VALUES,
      });
    }

    let filter = { status: actualStatus };
    if (agentId) filter.assignedTo = agentId;

    const leads = await req.CRMModel.find(filter).lean().sort({ updatedAt: -1 });

    res.json({ bucket: actualStatus, total: leads.length, leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


