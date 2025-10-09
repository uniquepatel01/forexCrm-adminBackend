const mongoose = require("mongoose");
const { getMainConnection } = require("../config/mainDb");
const getStatusBucketModel = require("../models/CRMstatusBucket")
const getBusinessType = require("../models/businessType");
const getBusinessVolume = require("../models/businessVolume")

const crmTypeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true }, // e.g., "Forex CRM"
    crmKey: { type: String, required: true, unique: true }, // e.g., "forex"
    imageUri: { type: String, default: "" },               // optional CRM logo
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",  // foreign key to superadmin
      required: true,
    },
    buckets: [{ type: mongoose.Schema.Types.ObjectId, ref: "CRMstatusBucket" }],
    businessType: [{type: mongoose.Schema.Types.ObjectId, ref: "businessType"}],
    businessVolume: [{type: mongoose.Schema.Types.ObjectId, ref: "businessVolume"}]
  },
  { timestamps: true }
);



module.exports = () => {
  const conn = getMainConnection();  
  getStatusBucketModel();
  getBusinessType();
  getBusinessVolume();
  return conn.models.CrmType || conn.model("CrmType", crmTypeSchema);
};
