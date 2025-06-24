const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const COLLECTION = "settings";

// Helper: get lang (nếu muốn đa ngôn ngữ, có thể mở rộng)
function getLang(req) {
  // Nếu muốn đa ngôn ngữ thì mở comment dưới
  // const lang = (req.query.lang || "vi").toLowerCase();
  // if (!["vi", "en", "ko"].includes(lang)) return null;
  // return lang;
  return "main";
}

// Lấy cấu hình (GET /api/settings)
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    const doc = await admin.firestore().collection(COLLECTION).doc(lang).get();
    if (!doc.exists)
      return res.status(404).json({ message: "No settings found." });
    res.json({ settings: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo mới cấu hình (POST /api/settings)
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (doc.exists)
      return res.status(400).json({ message: "Settings already exist." });

    const { color, companyName, slogan, hashtag } = req.body;
    if (!color || !companyName || !slogan || !hashtag) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await docRef.set({ color, companyName, slogan, hashtag });
    res.status(201).json({
      message: "Settings created.",
      settings: { color, companyName, slogan, hashtag },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa cấu hình (PUT /api/settings)
router.put("/", async (req, res) => {
  try {
    const lang = getLang(req);
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No settings to update." });

    const { color, companyName, slogan, hashtag } = req.body;
    if (!color && !companyName && !slogan && !hashtag) {
      return res.status(400).json({ message: "Missing fields to update." });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Settings updated.", settings: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa cấu hình (DELETE /api/settings)
router.delete("/", async (req, res) => {
  try {
    const lang = getLang(req);
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No settings to delete." });
    await docRef.delete();
    res.json({ message: "Settings deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
