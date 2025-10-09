const getCRMTypeModel = require("../models/crmType");
const getStatusBucketModel = require("../models/CRMstatusBucket");
const getBusinessTypeModel = require("../models/businessType");
const getBusinessVolumeModel = require("../models/businessVolume");
const {
  connections,
  connectCRM,
  getModel,
} = require("../config/crmConnection"); // your dynamic db utils


// ✅ Create or Update CRM with buckets, business types, and volumes
exports.createOrUpdateCRMType = async (req, res) => {
  try {
    if (!req.superAdmin) {
      return res.status(403).json({ message: "Only Super Admin can manage CRM" });
    }

    const {
      title,
      crmKey,
      imageUri,
      buckets = [],
      businessTypes = [],
      businessVolumes = []
    } = req.body;

    if (!title || !crmKey) {
      return res.status(400).json({ message: "title and crmKey are required" });
    }

    if (!Array.isArray(buckets) || !Array.isArray(businessTypes) || !Array.isArray(businessVolumes)) {
      return res.status(400).json({ message: "buckets, businessTypes, and businessVolumes must be arrays" });
    }

    const CRMType = getCRMTypeModel();
    const CRMStatusBucket = getStatusBucketModel();
    const BusinessType = getBusinessTypeModel();
    const BusinessVolume = getBusinessVolumeModel();

    // Validate all IDs belong to this superadmin
    const validBuckets = await CRMStatusBucket.find({ _id: { $in: buckets }, createdBy: req.superAdmin._id }).select("_id bucketName").lean();
    if (validBuckets.length !== buckets.length) {
      return res.status(400).json({ message: "Some buckets are invalid or not owned by you" });
    }

    const validTypes = await BusinessType.find({ _id: { $in: businessTypes }, createdBy: req.superAdmin._id }).select("_id businessTypeName").lean();
    if (validTypes.length !== businessTypes.length) {
      return res.status(400).json({ message: "Some business types are invalid or not owned by you" });
    }

    const validVolumes = await BusinessVolume.find({ _id: { $in: businessVolumes }, createdBy: req.superAdmin._id }).select("_id businessVolumeName").lean();
    if (validVolumes.length !== businessVolumes.length) {
      return res.status(400).json({ message: "Some business volumes are invalid or not owned by you" });
    }

    // Find existing CRM
    let crm = await CRMType.findOne({ crmKey: crmKey.toLowerCase(), createdBy: req.superAdmin._id });

    if (crm) {
      // === Update ===
      if (!connections[crmKey]) {
        const uri = process.env[`${crmKey.toUpperCase()}_URI`];
        if (!uri) return res.status(500).json({ message: `No DB URI for ${crmKey}` });
        await connectCRM(crmKey, uri);
      }

      const CRMLeadModel = getModel(crmKey);

      // --- Map current IDs to names ---
      const bucketDocs = await CRMStatusBucket.find({ _id: { $in: crm.buckets } }).select("_id bucketName").lean();
      const typeDocs   = await BusinessType.find({ _id: { $in: crm.businessType } }).select("_id businessTypeName").lean();
      const volumeDocs = await BusinessVolume.find({ _id: { $in: crm.businessVolume } }).select("_id businessVolumeName").lean();

      const bucketNames = bucketDocs.map(b => b.bucketName);
      const typeNames   = typeDocs.map(t => t.businessTypeName);
      const volumeNames = volumeDocs.map(v => v.businessVolumeName);

      // --- Check leads by names ---
      const usedBuckets = await CRMLeadModel.distinct("status", { status: { $in: bucketNames } }).catch(() => []);
      const usedTypes   = await CRMLeadModel.distinct("business_type", { business_type: { $in: typeNames } }).catch(() => []);
      const usedVolumes = await CRMLeadModel.distinct("Business_vol_Lakh_Per_Year", { Business_vol_Lakh_Per_Year: { $in: volumeNames } }).catch(() => []);

      // --- Prevent removal if name is used ---
      const preventBuckets = bucketDocs
        .filter(b => usedBuckets.includes(b.bucketName) && !buckets.includes(b._id.toString()))
        .map(b => b._id.toString());

      const preventTypes = typeDocs
        .filter(t => usedTypes.includes(t.businessTypeName) && !businessTypes.includes(t._id.toString()))
        .map(t => t._id.toString());

      const preventVolumes = volumeDocs
        .filter(v => usedVolumes.includes(v.businessVolumeName) && !businessVolumes.includes(v._id.toString()))
        .map(v => v._id.toString());

      // --- Final safe merge ---
      crm.buckets       = Array.from(new Set([...buckets.map(String), ...preventBuckets]));
      crm.businessType  = Array.from(new Set([...businessTypes.map(String), ...preventTypes]));
      crm.businessVolume= Array.from(new Set([...businessVolumes.map(String), ...preventVolumes]));

      crm.title = title || crm.title;
      crm.imageUri = imageUri || crm.imageUri;

      await crm.save();

      return res.json({
        message: "CRM updated",
        crm,
        preventedRemovals: {
          buckets: preventBuckets,
          businessTypes: preventTypes,
          businessVolumes: preventVolumes
        }
      });
    } else {
      // === Create new CRM ===
      crm = await CRMType.create({
        title,
        crmKey: crmKey.toLowerCase(),
        imageUri,
        createdBy: req.superAdmin._id,
        buckets: buckets.map(String),
        businessType: businessTypes.map(String),
        businessVolume: businessVolumes.map(String)
      });

      return res.status(201).json({ message: "CRM created", crm });
    }
  } catch (err) {
    console.error("❌ createOrUpdateCRMType error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ✅ Get all CRMs of logged-in superadmin (with populated Buckets)
exports.getMyCRMs = async (req, res) => {
  try {
    if (!req.superAdmin) {
      return res
        .status(403)
        .json({ message: "Only Super Admin can fetch their CRMs" });
    }

    const CRMType = getCRMTypeModel();
const crms = await CRMType.find({ createdBy: req.superAdmin._id })
  .populate("buckets")
  .populate("businessType")
  .populate("businessVolume");


    res.json(crms);
  } catch (err) {
    console.error("❌ getMyCRMs error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
