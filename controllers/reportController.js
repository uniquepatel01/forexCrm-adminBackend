const Forex = require('../models/forex');

// Get today's report
exports.getTodayReport = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails] = await Promise.all([
            Forex.countDocuments({ updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'converted', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'dnp', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'demo', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'busy', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'not interested', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'call me later', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'out of station', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'wrong number', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'dormants', updatedAt: { $gte: today, $lt: tomorrow } }),
            Forex.countDocuments({ status: 'emails', updatedAt: { $gte: today, $lt: tomorrow } })
        ]);

        res.json({
            period: 'Today',
            date: today.toISOString().split('T')[0],
            totalLeads,
            converted,
            dnp,
            demo,
            busy,
            notInterested,
            callMeLater,
            outOfStation,
            wrongNumber,
            dormant,
            emails
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get weekly report
exports.getWeeklyReport = async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const [totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails] = await Promise.all([
            Forex.countDocuments({ updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'converted', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'dnp', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'demo', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'busy', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'not interested', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'call me later', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'out of station', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'wrong number', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'dormants', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } }),
            Forex.countDocuments({ status: 'emails', updatedAt: { $gte: startOfWeek, $lt: endOfWeek } })
        ]);

        res.json({
            period: 'This Week',
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: endOfWeek.toISOString().split('T')[0],
            totalLeads,
            converted,
            dnp,
            demo,
            busy,
            notInterested,
            callMeLater,
            outOfStation,
            wrongNumber,
            dormant,
            emails
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get monthly report
exports.getMonthlyReport = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails] = await Promise.all([
            Forex.countDocuments({ updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'converted', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'dnp', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'demo', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'busy', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'not interested', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'call me later', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'out of station', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'wrong number', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'dormants', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } }),
            Forex.countDocuments({ status: 'emails', updatedAt: { $gte: startOfMonth, $lt: endOfMonth } })
        ]);

        res.json({
            period: 'This Month',
            month: startOfMonth.toLocaleString('default', { month: 'long' }),
            year: startOfMonth.getFullYear(),
            totalLeads,
            converted,
            dnp,
            demo,
            busy,
            notInterested,
            callMeLater,
            outOfStation,
            wrongNumber,
            dormant,
            emails
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get yearly report
exports.getYearlyReport = async (req, res) => {
    try {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        const [totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails] = await Promise.all([
            Forex.countDocuments({ updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'converted', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'dnp', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'demo', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'busy', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'not interested', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'call me later', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'out of station', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'wrong number', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'dormants', updatedAt: { $gte: startOfYear, $lt: endOfYear } }),
            Forex.countDocuments({ status: 'emails', updatedAt: { $gte: startOfYear, $lt: endOfYear } })
        ]);

        res.json({
            period: 'This Year',
            year: startOfYear.getFullYear(),
            totalLeads,
            converted,
            dnp,
            demo,
            busy,
            notInterested,
            callMeLater,
            outOfStation,
            wrongNumber,
            dormant,
            emails
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------- Agent-specific reports ----------------

async function getCountsForRangeAndAgent(range, agentId) {
    const assignedFilter = agentId ? { assignedTo: String(agentId) } : {};
    const dateFilter = { updatedAt: range };

    const criteria = (status) => ({ ...assignedFilter, ...(status ? { status } : {}), ...dateFilter });

    const [totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails] = await Promise.all([
        Forex.countDocuments(criteria()),
        Forex.countDocuments(criteria('converted')),
        Forex.countDocuments(criteria('dnp')),
        Forex.countDocuments(criteria('demo')),
        Forex.countDocuments(criteria('busy')),
        Forex.countDocuments(criteria('not interested')),
        Forex.countDocuments(criteria('call me later')),
        Forex.countDocuments(criteria('out of station')),
        Forex.countDocuments(criteria('wrong number')),
        Forex.countDocuments(criteria('dormants')),
        Forex.countDocuments(criteria('emails'))
    ]);

    return { totalLeads, converted, dnp, demo, busy, notInterested, callMeLater, outOfStation, wrongNumber, dormant, emails };
}

exports.getTodayReportForAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const counts = await getCountsForRangeAndAgent({ $gte: start, $lt: end }, id);
        res.json({ period: 'Today', date: start.toISOString().split('T')[0], agentId: id, ...counts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getWeeklyReportForAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        const counts = await getCountsForRangeAndAgent({ $gte: start, $lt: end }, id);
        res.json({ period: 'This Week', startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0], agentId: id, ...counts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMonthlyReportForAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const counts = await getCountsForRangeAndAgent({ $gte: start, $lt: end }, id);
        res.json({ period: 'This Month', month: start.toLocaleString('default', { month: 'long' }), year: start.getFullYear(), agentId: id, ...counts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getYearlyReportForAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 1);
        const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

        const counts = await getCountsForRangeAndAgent({ $gte: start, $lt: end }, id);
        res.json({ period: 'This Year', year: start.getFullYear(), agentId: id, ...counts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}; 