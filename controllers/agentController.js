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

// Agent login
exports.loginAgent = async (req, res) => {
  const { email, password } = req.body;
  const agent = await Agent.findOne({ email });
  if (!agent) return res.status(400).json({ message: 'Invalid email or password' });

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
    },
  });
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
