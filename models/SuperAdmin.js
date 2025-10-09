const mongoose = require('mongoose');
const { getMainConnection } = require("../config/mainDb");



const superAdminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    mobile: Number,
    password: String,
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, default: "superadmin" }
});

module.exports = () => {
  const conn = getMainConnection(); 
  return conn.models.SuperAdmin || conn.model("SuperAdmin", superAdminSchema);
};
