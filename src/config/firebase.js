const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount;
let useEnv = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const envValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    if (envValue.startsWith("{")) {
      serviceAccount = JSON.parse(envValue);
      useEnv = true;
    }
  } catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT parse error:", err);
    // Không throw ở đây, sẽ fallback sang file local
  }
}

if (!useEnv) {
  // Đọc file JSON local khi không có hoặc không hợp lệ biến môi trường
  const serviceAccountPath = path.resolve(
    __dirname,
    "../../huynh-lands-firebase-adminsdk-fbsvc-ae2a6b5dbb.json"
  );
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error("Service account file not found: " + serviceAccountPath);
  }
  serviceAccount = require(serviceAccountPath);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error("Firebase initialization error:", err);
    throw err;
  }
}

module.exports = admin;
