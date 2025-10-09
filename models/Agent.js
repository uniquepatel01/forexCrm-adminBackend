const mongoose = require('mongoose');
const { getMainConnection } = require("../config/mainDb");


const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true ,required: true, trim: true  },
  password: { type: String, required: true }, // hashed manually before save

  //  CRM Access (assigned by Admin)
  crmKey: { 
    type: String, 
    required: true, // e.g., "forex", "realestate", "insurance"
  },

  number: { type: String, default: "" }, 
  joining: { type: Date, default: Date.now },
  address: { type: String, default: "" },
  gender: { type: String, default: "" },
  
  imageUri: { type: String, default: null },
  imagePublicId: { type: String, default: null },

  isBlocked: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = () => {
  const conn = getMainConnection();  
  return conn.models.Agent || conn.model("Agent", agentSchema);
};
