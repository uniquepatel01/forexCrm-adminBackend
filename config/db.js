const mongoose = require("mongoose");

const connections = {}; // cache CRM connections

// Connect to CRM database
const connectCRM = async (crmKey, uri) => {
  if (connections[crmKey]) {
    return connections[crmKey];
  }

  try {
    const conn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    conn.on("connected", () => {
      console.log(`✅ Connected to ${crmKey} CRM database`);
    });

    conn.on("error", (err) => {
      console.error(`❌ Error connecting to ${crmKey} CRM database:`, err.message);
    });

    connections[crmKey] = conn;
    return conn;
  } catch (error) {
    console.error(`❌ Could not connect to ${crmKey}:`, error.message);
    throw error;
  }
};

// Get existing connection
const getConnection = (crmKey) => connections[crmKey];

module.exports = { connectCRM, getConnection };
