const getStatusBucketModel = require("../models/CRMstatusBucket");
const getCRMTypeModel = require("../models/crmType");
const {
  connectCRM,
  getModel,
  connections,
} = require("../config/crmConnection");

exports.createBuckets = async (req, res) => {
  try {
    const { bucketName, bucketColor } = req.body;
    const superAdminId = req.superAdmin._id; // from protectSuperAdmin middleware

    const CRMStatus = getStatusBucketModel();

    const checkBucket = await CRMStatus.findOne({ bucketName: bucketName });
    if (!checkBucket) {
      const buckets = await CRMStatus.create({
        bucketName,
        bucketColor,
        createdBy: superAdminId,
      });
      res.status(201).json({ message: "Buckets created", buckets });
    }else{
      res.status(500).json({message: "Buckets Already created"});
    }
  } catch (err) {
    console.error("createStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getbuckets = async (req, res) => {
  try {
    const superAdminId = req.superAdmin._id;
    const CRMStatus = getStatusBucketModel();

    const buckets = await CRMStatus.find({ createdBy: superAdminId });

    res.json(buckets);
  } catch (err) {
    console.error("getbuckets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update existing bucket (SuperAdmin only)
exports.updateBucket = async (req, res) => {
  try {
    const superAdminId = req.superAdmin._id;
    const { bucketId } = req.params;
    const { bucketName, bucketColor } = req.body;

    if (!bucketName && !bucketColor) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const CRMStatus = getStatusBucketModel();
    const CRMType = getCRMTypeModel();

    // Find the bucket and ensure it belongs to the superadmin
    const bucket = await CRMStatus.findOne({ _id: bucketId, createdBy: superAdminId });
    if (!bucket) {
      return res.status(404).json({ message: "Bucket not found or not owned by you" });
    }

    // --- Check if this bucket is used in any CRM ---
    const crmsUsingBucket = await CRMType.find({ buckets: bucketId }).lean();

    for (const crm of crmsUsingBucket) {
      // Ensure connection to CRM DB
      if (!connections[crm.crmKey]) {
        const uri = process.env[`${crm.crmKey.toUpperCase()}_URI`];
        if (!uri) continue; // skip if no URI
        await connectCRM(crm.crmKey, uri);
      }

      const CRMLeadModel = getModel(crm.crmKey);

      // Map bucketId to bucketName for lead matching
      const bucketDoc = await CRMStatus.findById(bucketId).select("bucketName").lean();
      const bucketNameForCheck = bucketDoc?.bucketName;

      if (!bucketNameForCheck) continue;

      const leadUsingBucket = await CRMLeadModel.exists({ status: bucketNameForCheck });
      if (leadUsingBucket) {
        return res.status(400).json({
          message: `Cannot update bucket. There are leads using this bucket in CRM: ${crm.crmKey}`,
        });
      }
    }

    // ✅ Safe to update
    if (bucketName) bucket.bucketName = bucketName;
    if (bucketColor) bucket.bucketColor = bucketColor;

    await bucket.save();

    res.status(200).json({ message: "Bucket updated successfully", bucket });
  } catch (err) {
    console.error("❌ updateBucket error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


