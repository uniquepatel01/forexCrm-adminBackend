require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectMainDB } = require("./config/mainDb");
const SuperAdmin = require("./models/SuperAdmin"); // this is a function

(async () => {
  try {
    const conn = await connectMainDB(process.env.MAIN_DB_URI);

    const SuperAdminModel = SuperAdmin(); // ✅ get model from function

    const existing = await SuperAdminModel.findOne({ email: "superadmin@example.com" });
    if (existing) {
      console.log("SuperAdmin already exists:", existing.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("superpassword", 10);

    const superAdmin = await SuperAdminModel.create({
      name: "Super Admin",
      email: "superadmin@example.com",
      mobile: 1234567890,
      password: hashedPassword,
    });

    console.log("✅ SuperAdmin created:", superAdmin.email, superAdmin.role);
    process.exit(0);
  } catch (err) {
    console.error(" Error seeding SuperAdmin:", err);
    process.exit(1);
  }
})();
