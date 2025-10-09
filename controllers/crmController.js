const getCRMTypeModel = require("../models/crmType");
const getBusinessTypeModel = require("../models/businessType");
const getBusinessVolumeModel = require("../models/businessVolume");

// controllers/crmController.js

const getAgentModel  = require("../models/Agent");


// ✅ Create a new Lead/Entry
exports.addEntry = async (req, res) => {
  try {
    const payload = { ...req.body };

    // ✅ If request is from an agent
    if (req.agent) {
      payload.assignedTo = req.userId;

      // status is mandatory for agents
      if (!payload.status || !payload.status.trim()) {
        return res.status(400).json({ message: "Status is required when agent adds a lead." });
      }
    }

    // ✅ If request is from admin, do nothing extra
    // assignedTo & status remain optional

    const entry = new req.CRMModel(payload); // dynamic model
    await entry.save();

    res.status(201).json({ message: "Entry created", entry });
  } catch (err) {
    console.error("Error creating entry:", err);
    res.status(400).json({ message: err.message });
  }
};



// Business Types Dropdown
exports.getBusinessTypesForLead = async (req, res) => {
  try {
    const CRMType = getCRMTypeModel();

    const crm = await CRMType.findOne({ crmKey: req.crmKey })
      .populate({
        path: "businessType",
        select: "_id businessTypeName"  // ✅ correct field
      })
      .lean();

    if (!crm) {
      return res.status(404).json({ message: "CRM not found" });
    }

    return res.json({
      crmKey: req.crmKey,
      businessTypes: crm.businessType || [],
    });
  } catch (err) {
    console.error("❌ getBusinessTypesForLead error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Business Volumes Dropdown
exports.getBusinessVolumesForLead = async (req, res) => {
  try {
    const CRMType = getCRMTypeModel();

    const crm = await CRMType.findOne({ crmKey: req.crmKey })
      .populate({
        path: "businessVolume",
        select: "_id businessVolumeName"  // ✅ adjust based on your schema
      })
      .lean();

    if (!crm) {
      return res.status(404).json({ message: "CRM not found" });
    }

    return res.json({
      crmKey: req.crmKey,
      businessVolumes: crm.businessVolume || [],
    });
  } catch (err) {
    console.error("❌ getBusinessVolumesForLead error:", err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get all leads for this CRM
exports.getAllLeads = async (req, res) => {
  try {
    const { agentId } = req.query; // agentId will come from query ?agentId=123

    let filter = { assignedTo: { $ne: null } };

    // If agentId is present, filter leads by that agent
    if (agentId) {
      filter.assignedTo = agentId;
    }

    const leads = await req.CRMModel.find(filter).sort({ updatedAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// controllers/crmBulkController.js
exports.bulkUploadLeads = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({ message: "Only admin can upload leads" });
    }

    let leads = req.body;

    // ✅ Ensure array
    if (!Array.isArray(leads)) {
      return res.status(400).json({ message: "Request body must be an array of leads" });
    }

    // ✅ Clean & normalize data + set business_type = req.crmKey
    leads = leads.map((lead) => ({
      Company_name: lead.Company_name || "",
      Business_vol_Lakh_Per_Year: lead.Business_vol_Lakh_Per_Year || "",
      Address: lead.Address || "",
      City: lead.City || "",
      State: lead.State || "",
      Country: lead.Country || "",
      contact_person: lead.contact_person || "",   // 👈 fixed casing
      Mobile_no: lead.Mobile_no || "",             // 👈 match schema
      Landline_no: lead.Landline_no || "",
      E_mail_id: lead.E_mail_id || "",             // 👈 match schema
      status: lead.status || "",
      assignedTo: lead.assignedTo || null,
      Remarks: lead.Remarks || [],
      business_type: req.crmKey || "unknown",      // 👈 force from crmKey
      updatedAt: new Date()
    }));

    // ✅ Insert into CRM collection dynamically
    const result = await req.CRMModel.insertMany(leads, { ordered: false });

    res.status(201).json({
      message: `✅ Bulk upload successful. Inserted ${result.length} leads`,
      inserted: result.length,
    });
  } catch (err) {
    console.error("❌ Bulk upload error:", err);
    res.status(500).json({ message: "Bulk upload failed", error: err.message });
  }
};




exports.getEntryById = async (req, res) => {
  try {
    const Agent = getAgentModel(req.crmKey); // get Agent model for this CRM DB

    const entry = await req.CRMModel.findById(req.params.id)
      .populate({ path: "assignedTo", model: Agent, select: "name" });

    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (err) {
    console.error("🔥 getEntryById error:", err);
    res.status(500).json({ message: err.message });
  }
};




// ✅ Update an entry by ID
exports.updateEntry = async (req, res) => {
  try {
    const entry = await req.CRMModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry updated", entry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ✅ Delete an entry by ID
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await req.CRMModel.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
