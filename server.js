const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectMainDB } = require("./config/mainDb");
const { connectCRM } = require("./config/crmConnection");



// Routes
const adminRoutes = require("./routes/adminRoute");
const agentRoutes = require("./routes/agentRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const reportRoutes = require("./routes/reportRoute");
const uploadRoutes = require("./routes/uploadRoute");
const clientsRoute = require("./routes/clientsRoute");
const apkRoutes = require("./approutes/apkRoutes");
const superAdminRoute = require("./routes/superAdminRouter");
const crmRoutes = require("./routes/crmRoutes")

dotenv.config();
const app = express();
const PORT = process.env.PORT || 2000;

app.use(cors({ origin: ["*", "http://localhost:5173", "http://localhost:2000", "https://crm-admin-frontend-seven.vercel.app"], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base route
app.get("/", (req, res) => res.send("Welcome to the Dynamic Multi-CRM API!"));

// Attach existing routes
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientsRoute);
app.use("/api/crm", crmRoutes)
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/apk", apkRoutes);
app.use("/api",superAdminRoute);



// Async init
(async () => {
  try {
    // 1️⃣ Connect main DB
    await connectMainDB(process.env.MAIN_DB_URI);
    console.log(`✅ Main DB connected: ${process.env.MAIN_DB_URI}`);

    // 2️⃣ Connect all CRMs
    await connectCRM("forex", process.env.FOREX_URI);
    await connectCRM("gold", process.env.GOLD_URI);

    // 3️⃣ Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect Main DB or CRMs:", err.message);
    process.exit(1);
  }
})();
