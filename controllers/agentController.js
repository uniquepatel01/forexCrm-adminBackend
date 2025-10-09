const getAgentModel = require('../models/Agent');
const bcrypt = require('bcryptjs');
const Forex = require('../models/crmModel');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");

// crm key will be fixed with the req.crmKey of admin token later ......
exports.registerAgent = async (req, res) => {
  const Agent = getAgentModel();
  const { name, email, password, number, joining, address, gender } = req.body;

  const exists = await Agent.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Agent already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const CRMKEY = req.crmKey;

  const agent = await Agent.create({
    name,
    email,
    password: hashedPassword,
    crmKey: CRMKEY,
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
      crmKey: agent.crmKey,
      number: agent.number,
      joining: agent.joining,
      gender: agent.gender
    },
  });
};

// Overwrite login to also prevent trashed agents from logging in
exports.loginAgent = async (req, res) => {
  const Agent = getAgentModel();

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


  const token = jwt.sign({ id: agent._id,crmKey: agent.crmKey, version: agent.tokenVersion || 0 }, process.env.JWT_SECRET);
  res.json({
    token,
    agent: {
      id: agent._id,
      name: agent.name,
      email: agent.email,
      crmKey: agent.crmKey,
      isBlocked: agent.isBlocked,
      isTrashed: agent.isTrashed,
    },
  });
};

// Block an agent (admin only)
exports.blockAgent = async (req, res) => {
  const { id } = req.params;
  const Agent = getAgentModel();

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
  const Agent = getAgentModel();

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
  const Agent = getAgentModel();
 
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
  const Agent = getAgentModel();

  const trashed = await Agent.find({ isTrashed: true }).select('-password');
  res.json(trashed);
};

exports.getBlockAgent = async(req, res)=>{
    const Agent = getAgentModel();

  const block = await Agent.find({isBlocked:true}).select('-password');
  res.json(block)
}

// controllers/agentController.js
exports.updateAgentProfile = async (req, res) => {
  try {
    const Agent = getAgentModel();

    // 🟢 Figure out who's making the request
    const isAgent = !!req.agent;
    const isAdmin = !!req.admin;

    if (!isAgent && !isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🟢 Determine which agent to update
    // - Agent → update self
    // - Admin → update agent by :id param (or fallback to req.body.id)
    const agentId = isAgent
      ? req.agent._id
      : req.params.id || req.body.id;

    if (!agentId) {
      return res.status(400).json({ message: "Agent ID is required" });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const {
      name,
      email,
      password,
      // crmType,
      number,
      address,
      gender,
      joining,
    } = req.body;

    // 🟢 Image upload (optional)
    let imageUri = null;
    let imagePublicId = null;

    if (req.file) {
      try {
        const {
          uploadToCloudinary,
          deleteFromCloudinary,
        } = require("../utils/cloudinary");

        const uploadResult = await uploadToCloudinary(req.file.buffer, {
          folder: "agent-profiles",
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" },
          ],
        });

        imageUri = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;

        // Delete old image if exists
        if (agent.imagePublicId) {
          await deleteFromCloudinary(agent.imagePublicId);
        }
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({
          error: "Failed to upload image",
          details: uploadError.message,
        });
      }
    }

    // 🟢 Update fields dynamically
    if (name) agent.name = name;
    if (email) agent.email = email;
    // if (crmType) agent.crmType = crmType;
    if (number) agent.number = number;
    if (address) agent.address = address;
    if (gender) agent.gender = gender;
    if (joining) agent.joining = joining;

    if (password) {
      const bcrypt = require("bcryptjs");
      agent.password = await bcrypt.hash(password, 10);
    }

    if (imageUri) {
      agent.imageUri = imageUri;
      agent.imagePublicId = imagePublicId;
    }

    await agent.save();

    res.status(200).json({
      message: "Profile updated successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        crmType: agent.crmType,
        number: agent.number,
        address: agent.address,
        gender: agent.gender,
        joining: agent.joining,
        imageUri: agent.imageUri || null,
      },
    });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res
      .status(500)
      .json({ error: "Failed to update profile", details: err.message });
  }
};


// Get leads assigned to the authenticated agent // error generate here you have to connect database in protected field
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

    const leads = await req.CRMModel.find(criteria).sort({ updatedAt: -1 });
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

    // Convert id to ObjectId for Mongo if needed
    const assignedFilter = { assignedTo: new mongoose.Types.ObjectId(id) };

    // 🔹 Build status filter
    let statusFilter = {};
    if (status) {
      // Find the actual bucket name from dynamic STATUS_VALUES
      const matchedBucket = req.STATUS_VALUES.find(
        (b) => b.toLowerCase() === status.toLowerCase()
      );
      if (matchedBucket) {
        // Case-insensitive regex to match in DB
        statusFilter = { status: { $regex: new RegExp(`^${matchedBucket}$`, "i") } };
      }
    }

    const criteria = { ...assignedFilter, ...statusFilter };

    const leads = await req.CRMModel.find(criteria).lean().sort({ updatedAt: -1 });

    return res.json(leads);
  } catch (error) {
    console.error("🔥 getAgentLeads error:", error);
    return res.status(500).json({ message: "Failed to fetch agent leads", error: error.message });
  }
};


// get All Agent list

exports.getAllAgent = async (req, res) => {
  try {
    const Agent = getAgentModel();

    const agents = await Agent.find({isBlocked:false, isTrashed: false, crmKey: req.crmKey}, { password: 0 }); // exclude password field
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// for Specific agent 

exports.getAgent = async (req, res) => {

  try {
    const Agent = getAgentModel();

    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
