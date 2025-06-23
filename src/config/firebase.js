const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.resolve(
  __dirname,
  "../../huynh-lands-firebase-adminsdk-fbsvc-ae2a6b5dbb.json"
);
console.log("Service Account Path:", serviceAccountPath);

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
  console.log("Service Account Loaded:", !!serviceAccount);
} catch (err) {
  console.error("Failed to load service account JSON:", err);
  throw err;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase initialized successfully");
} catch (err) {
  console.error("Firebase initialization error:", err);
  throw err;
}

module.exports = admin;
