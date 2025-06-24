const admin = require("firebase-admin");

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT parse error:", err);
    throw err;
  }
} else {
  throw new Error("FIREBASE_SERVICE_ACCOUNT env variable is not set");
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
