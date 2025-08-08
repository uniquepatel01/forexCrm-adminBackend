const Forex = require('../models/forex'); 



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

//total futureLeads
exports.getTotalFutureLeads = async (req, res) =>{
    try {
        const count = await Forex.countDocuments({status: 'future'})
        res.json({totalFutureLeads: count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

//total NotInterested Leads
exports.getTotalNotInterested = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'not interested'})
        res.json({totalNotInterest:count})
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

// total Dormants Leads
exports.getTotalDormants = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'dormants'})
        res.json({totalDormants:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

// Total Busy Leads
exports.getTotalBusy = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'busy'})
        res.json({totalBusy:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

// Total Out of Station Leads 
exports.getTotalOutofStation = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'out of station'})
        res.json({totalOutofStation:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

// Total Call me later Leads
exports.getTotalCallMeLater = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'call me later'})
        res.json({totalCallMeLater:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

//total emails leads

exports.getTotalEmails = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status:'emails'})
        res.json({totalEmails:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

//total wrong number leads
exports.getTotalWrongNumber = async (req, res)=>{
    try {
        const count = await Forex.countDocuments({status : 'wrong number'})
        res.json({totalWrongNumber:count})
    } catch (err){
        res.status(500).json({message: err.message})
    }
}

