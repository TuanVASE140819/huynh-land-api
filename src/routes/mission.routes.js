const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection name
const COLLECTION = "missions";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// Hiển thị sứ mệnh
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const doc = await admin.firestore().collection(COLLECTION).doc(lang).get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No mission found for this language." });
    res.json({ mission: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Thêm sứ mệnh
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (doc.exists)
      return res
        .status(400)
        .json({ message: "Mission already exists for this language." });

    // Kiểm tra dữ liệu đầu vào
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.set({ title, content });
    res
      .status(201)
      .json({ message: "Mission created.", mission: { title, content } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa sứ mệnh
router.put("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No mission to update for this language." });

    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Mission updated.", mission: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa sứ mệnh
router.delete("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No mission to delete for this language." });
    await docRef.delete();
    res.json({ message: "Mission deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
