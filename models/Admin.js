const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    tokenVersion: { type: Number, default: 0 }
});

module.exports = mongoose.model('Admin', adminSchema);