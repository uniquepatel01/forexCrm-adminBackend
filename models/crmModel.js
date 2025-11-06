const mongoose = require("mongoose");

const remarkSchema = new mongoose.Schema({
  comment: { type: String },
  date: { type: Date, default: Date.now },
});

const crmSchema = new mongoose.Schema({
  Company_name: { type: String, required: true },
  Business_vol_Lakh_Per_Year: { type: String },
  Address: { type: String },
  City: { type: String },
  State: { type: String, default: "" },
  Country: { type: String, default: "" },
  Mobile_no: { type: String, required:true },
  Landline_no: { type: String },
  E_mail_id: { type: String },

  updatedAt: { type: Date, default: Date.now },
  status: { type: String, default: "" },
  Remarks: [remarkSchema],

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    default: null,
  },

  business_type: { type: String, required:true },
  contact_person: { type: String, default: "" },
  source: { type: String, default: "" },
});

// Ensure a unique index on Mobile_no to prevent duplicates at the DB level.
// Note: adding `unique: true` here helps Mongoose create the index if autoIndex is enabled.
crmSchema.index({ Mobile_no: 1 }, { unique: true });

module.exports = crmSchema;
