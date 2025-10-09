const mongoose = require("mongoose");
const crmSchema = require("../models/crmModel");

const connections = {}; // { forex: { conn, models: {} } }

async function connectCRM(crmKey, uri) {
  if (!uri) throw new Error(`Missing DB URI for CRM: ${crmKey}`);

  if (!connections[crmKey]) {
    const conn = await mongoose.createConnection(uri);
    connections[crmKey] = { conn, models: {} };
    console.log(`✅ Connected to ${crmKey} CRM database`);
  }

  return connections[crmKey].conn;
}

function getModel(crmKey, collectionName = "Clients") {
  const crm = connections[crmKey];
  if (!crm) throw new Error(`CRM not connected yet: ${crmKey}`);

  if (!crm.models[collectionName]) {
    crm.models[collectionName] = crm.conn.model(collectionName, crmSchema, collectionName);
  }

  return crm.models[collectionName];
}

module.exports = { connectCRM, getModel, connections };
