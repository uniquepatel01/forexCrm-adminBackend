const Forex = require('../models/forex');

// Create a new Forex entry
exports.addForex = async (req, res) => {
    try {
        const forex = new Forex(req.body);
        await forex.save();
        res.status(201).json({ message: 'Forex entry created', forex });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all Forex entries
exports.getAllForex = async (req, res) => {
    try {
        const forexList = await Forex.find();
        res.json(forexList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single Forex entry by ID
exports.getForexById = async (req, res) => {
    try {
        const forex = await Forex.findById(req.params.id);
        if (!forex) return res.status(404).json({ message: 'Forex entry not found' });
        res.json(forex);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update a Forex entry by ID
exports.updateForex = async (req, res) => {
    try {
        const forex = await Forex.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!forex) return res.status(404).json({ message: 'Forex entry not found' });
        res.json({ message: 'Forex entry updated', forex });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a Forex entry by ID
exports.deleteForex = async (req, res) => {
    try {
        const forex = await Forex.findByIdAndDelete(req.params.id);
        if (!forex) return res.status(404).json({ message: 'Forex entry not found' });
        res.json({ message: 'Forex entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};