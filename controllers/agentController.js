const Agent = require('../models/Agent');
const bcrypt = require('bcryptjs');

exports.registerAgent = async (req, res) => {
  const { name, email, password, crmType } = req.body;

  const exists = await Agent.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Agent already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const agent = await Agent.create({
    name,
    email,
    password: hashedPassword,
    crmType,
  });

  res.status(201).json({
    message: 'Agent created successfully',
    agent: {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      crmType: agent.crmType,
    },
  });
};

// Overwrite login to also prevent trashed agents from logging in
exports.loginAgent = async (req, res) => {
  const { email, password } = req.body;
  const agent = await Agent.findOne({ email });
  if (!agent) return res.status(400).json({ message: 'Invalid email or password' });

  if (agent.isTrashed) {
    return res.status(403).json({ message: 'Your account is in trash. Contact administrator.' });
  }
  if (agent.isBlocked) {
    return res.status(403).json({ message: 'Your account is blocked. Contact administrator.' });
  }

  const isMatch = await bcrypt.compare(password, agent.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: agent._id }, process.env.JWT_SECRET);
  res.json({
    token,
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      crmType: agent.crmType,
      isBlocked: agent.isBlocked,
      isTrashed: agent.isTrashed,
    },
  });
};

// Block an agent (admin only)
exports.blockAgent = async (req, res) => {
  const { id } = req.params;
  const agent = await Agent.findById(id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  if (agent.isBlocked) return res.status(400).json({ message: 'Agent already blocked' });
  agent.isBlocked = true;
  await agent.save();
  res.json({ message: 'Agent blocked successfully' });
};

// Unblock an agent (admin only)
exports.unblockAgent = async (req, res) => {
  const { id } = req.params;
  const agent = await Agent.findById(id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  if (!agent.isBlocked) return res.status(400).json({ message: 'Agent is not blocked' });
  agent.isBlocked = false;
  await agent.save();
  res.json({ message: 'Agent unblocked successfully' });
};

// Move agent to trash (admin only)
exports.trashAgent = async (req, res) => {
  const { id } = req.params;
  const agent = await Agent.findById(id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  if (agent.isTrashed) return res.status(400).json({ message: 'Agent already in trash' });
  agent.isTrashed = true;
  agent.deletedAt = new Date();
  await agent.save();
  res.json({ message: 'Agent moved to trash' });
};

// Restore agent from trash (admin only)
exports.restoreAgent = async (req, res) => {
  const { id } = req.params;
  const agent = await Agent.findById(id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });
  if (!agent.isTrashed) return res.status(400).json({ message: 'Agent is not in trash' });
  agent.isTrashed = false;
  agent.deletedAt = null;
  await agent.save();
  res.json({ message: 'Agent restored from trash' });
};

// List all trashed agents (admin only)
exports.getTrashedAgents = async (_req, res) => {
  const trashed = await Agent.find({ isTrashed: true }).select('-password');
  res.json(trashed);
};

// Update agent profile
exports.updateAgentProfile = async (req, res) => {
  const Agent = require('../models/Agent');
  const agent = await Agent.findById(req.agent.id);
  if (!agent) return res.status(404).json({ message: 'Agent not found' });

  const { name, email, password, crmType } = req.body;
  if (name) agent.name = name;
  if (email) agent.email = email;
  if (crmType) agent.crmType = crmType;
  if (password) {
    const bcrypt = require('bcryptjs');
    agent.password = await bcrypt.hash(password, 10);
  }
  await agent.save();
  res.json({
    message: 'Profile updated successfully',
    agent: {
      name: agent.name,
      email: agent.email,
      crmType: agent.crmType,
    },
  });
};
