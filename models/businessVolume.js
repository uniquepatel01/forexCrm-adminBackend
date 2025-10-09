const mongoose = require("mongoose");
const { getMainConnection } = require("../config/mainDb");

const businessVolumeSchema = new mongoose.Schema({
  businessVolumeName: { type: String, required: true, unique: true},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin", required: true } 
}, { timestamps: true });

module.exports = () => {
  const conn = getMainConnection();  
  return conn.models.businessVolume || conn.model("businessVolume", businessVolumeSchema);
};
