const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const Admin = require("./models/Admin");

dotenv.config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashed = await bcrypt.hash("yourPassword123", 10);

  await Admin.deleteMany(); // optional: remove previous
  await Admin.create({
    name: "Main Admin",
    email: "admin@salescrm.com",
    password: hashed,
  });

  console.log("Admin seeded!");
  process.exit();
});
