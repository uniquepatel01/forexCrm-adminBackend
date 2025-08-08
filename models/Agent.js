const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true }, // hashed manually before save
  crmType: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Agent', agentSchema);