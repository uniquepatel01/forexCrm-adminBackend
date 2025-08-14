const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true }, // hashed manually before save
  crmType: { type: String, required: true },
  number: { type: Number, default: "" },
  joining: { type: Date, default: "" },
  address: { type: String, default: "" },
  gender: { type: String, default: "" },
  isBlocked: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 }
});

module.exports = mongoose.model('Agent', agentSchema);