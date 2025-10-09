const mongoose = require("mongoose");
const { getMainConnection } = require("../config/mainDb");

const crmStatusBucketSchema = new mongoose.Schema({
  bucketName: { type: String, required: true, unique: true},
  bucketColor: { type: String, default: "#000000" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin", required: true } 
}, { timestamps: true });

module.exports = () => {
  const conn = getMainConnection();  
  return conn.models.CRMstatusBucket || conn.model("CRMstatusBucket", crmStatusBucketSchema);
};
