const mongoose = require("mongoose");

let mainConnection = null;

async function connectMainDB(uri) {
  if (!mainConnection) {
    mainConnection = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Main DB connected: ${uri}`);
  }
  return mainConnection;
}

function getMainConnection() {
  if (!mainConnection) throw new Error("Main DB not connected yet!");
  return mainConnection;
}

module.exports = { connectMainDB, getMainConnection };
