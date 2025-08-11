const Forex = require('../models/forex');

// Total Busy Leads
exports.getTotalBusy = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'busy'})
        res.json({totalBusy:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

//total Dnp Leads
exports.getTotalDnp = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'dnp'})
        res.json({totalDnp:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}


// Total converted leads
exports.getTotalConverted = async (req, res) => {
    try {
        const count = await Forex.countDocuments({ status: 'converted' });
        res.json({ totalConverted: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Total Demo leads
exports.getTotalDemo = async (req, res) => {
    try {
        const count = await Forex.countDocuments({status: 'demo'});
        res.json({ totalDemo: count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}