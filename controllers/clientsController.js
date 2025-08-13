const Forex = require('../models/forex');

// Generic function to get total leads by status
exports.getTotalLeadsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        // Validate status parameter
        const validStatuses = [
            'converted', 'demo', 'future', 'not interested', 'dnp',
            'dormants', 'busy', 'out of station', 'call me later',
            'emails', 'wrong number'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses
            });
        }

        const count = await Forex.countDocuments({ status });

        // Create response key based on status
        const responseKey = `total${status.charAt(0).toUpperCase() + status.slice(1).replace(/\s+/g, '')}`;

        res.json({ [responseKey]: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all status counts in a single request
exports.getAllStatusCounts = async (req, res) => {
    try {
        const statuses = [
            'converted', 'demo', 'future', 'not interested', 'dnp',
            'dormants', 'busy', 'out of station', 'call me later',
            'emails', 'wrong number'
        ];

        const counts = {};

        // Get counts for all statuses
        for (const status of statuses) {
            const count = await Forex.countDocuments({ status });
            const responseKey = `total${status.charAt(0).toUpperCase() + status.slice(1).replace(/\s+/g, '')}`;
            counts[responseKey] = count;
        }

        res.json(counts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

