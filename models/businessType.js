const mongoose = require("mongoose");
const { getMainConnection } = require("../config/mainDb");

const businessTypeSchema = new mongoose.Schema({
  businessTypeName: { type: String, required: true, unique: true},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin", required: true } 
}, { timestamps: true });

module.exports = () => {
  const conn = getMainConnection();  
  return conn.models.businessType || conn.model("businessType", businessTypeSchema);
};
