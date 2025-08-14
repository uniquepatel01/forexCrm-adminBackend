const Agent = require('../models/Agent');
const bcrypt = require('bcryptjs');
const Forex = require('../models/forex');
const jwt = require('jsonwebtoken');


exports.registerAgent = async (req, res) => {
  const { name, email, password, crmType, number, joining, address, gender } = req.body;

  const exists = await Agent.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Agent already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const agent = await Agent.create({
    name,
    email,
    password: hashedPassword,
    crmType,
    number,
    joining,
    address,
    gender
  });

  res.status(201).json({
    message: 'Agent created successfully',
    agent: {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      crmType: agent.crmType,
      number: agent.number,
      joining: agent.joining,
      gender: agent.gender
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


  const token = jwt.sign({ id: agent._id, version: agent.tokenVersion || 0 }, process.env.JWT_SECRET);
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

// Assign one unassigned lead to the requesting agent atomically
exports.fetchLeadForAgent = async (req, res) => {
  try {
    const requester = req.agent;
    const agentId = requester?._id || requester?.id;
    if (!agentId) return res.status(401).json({ message: 'Not authorized' });

    // Ensure agent is allowed
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: 'Agent not found' });
    if (agent.isTrashed) return res.status(403).json({ message: 'Your account is in trash. Contact administrator.' });
    if (agent.isBlocked) return res.status(403).json({ message: 'Your account is blocked. Contact administrator.' });

    // Atomically pick one unassigned lead and assign to this agent
    const assignedLead = await Forex.findOneAndUpdate(
      { assignedTo: null },
      { $set: { assignedTo: String(agentId), updatedAt: new Date() } },
      { sort: { _id: 1 }, returnDocument: 'after' }
    );

    if (!assignedLead) {
      return res.status(404).json({ message: 'No unassigned leads available' });
    }

    return res.json({ message: 'Lead assigned successfully', lead: assignedLead });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lead', error: error.message });
  }
};

// Get leads assigned to the authenticated agent
exports.getMyLeads = async (req, res) => {
  try {
    const requester = req.agent;
    const agentId = requester?._id || requester?.id;
    if (!agentId) return res.status(401).json({ message: 'Not authorized' });

    const { status } = req.query;
    const criteria = { assignedTo: String(agentId) };
    if (status && typeof status === 'string') {
      criteria.status = status;
    }

    const leads = await Forex.find(criteria);
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch leads', error: error.message });
  }
};

// Admin: get leads assigned to a specific agent
exports.getAgentLeads = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    const criteria = { assignedTo: String(id) };
    if (status && typeof status === 'string') {
      criteria.status = status;
    }

    const leads = await Forex.find(criteria);
    return res.json(leads);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch agent leads', error: error.message });
  }
};

// get All Agent list

exports.getAllAgent = async (req, res) => {
  try {
    const agents = await Agent.find({}, { password: 0 }); // exclude password field
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// for Specific agent 

exports.getAgent = async (req, res) => {

  try {
    const agent = await Agent.findById(req.params.id, { password: 0 });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
