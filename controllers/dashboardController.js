const Forex = require('../models/forex');

// Total number of leads
exports.getTotalLeads = async (req, res) => {
    try {
        const total = await Forex.countDocuments();
        res.json({ totalLeads: total });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Leads assigned to an agent
exports.getLeadsWithAgent = async (req, res) => {
    try {
        const count = await Forex.countDocuments({ assignedTo: { $ne: null } });
        res.json({ leadsWithAgent: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Total converted leads
exports.getTotalConverted = async (req, res) => {
    try {
        const count = await Forex.countDocuments({ status: 'converted' });
        res.json({ totalConverted: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Converted leads assigned to an agent
exports.getConvertedWithAgent = async (req, res) => {
    try {
        const count = await Forex.countDocuments({ status: 'converted', assignedTo: { $ne: null } });
        res.json({ convertedWithAgent: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// All analytics in one endpoint
exports.getAllAnalytics = async (req, res) => {
    try {
        const [totalLeads, leadsWithAgent, totalConverted, convertedWithAgent] = await Promise.all([
            Forex.countDocuments(),
            Forex.countDocuments({ assignedTo: { $ne: null } }),
            Forex.countDocuments({ status: 'converted' }),
            Forex.countDocuments({ status: 'converted', assignedTo: { $ne: null } })
        ]);
        res.json({
            totalLeads,
            leadsWithAgent,
            totalConverted,
            convertedWithAgent
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};