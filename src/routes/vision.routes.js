const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection name
const COLLECTION = "visions";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// Hiển thị tầm nhìn
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const doc = await admin.firestore().collection(COLLECTION).doc(lang).get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No vision found for this language." });
    res.json({ vision: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Thêm tầm nhìn
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (doc.exists)
      return res
        .status(400)
        .json({ message: "Vision already exists for this language." });

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.set({ title, content });
    res
      .status(201)
      .json({ message: "Vision created.", vision: { title, content } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa tầm nhìn
router.put("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No vision to update for this language." });

    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Vision updated.", vision: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa tầm nhìn
router.delete("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No vision to delete for this language." });
    await docRef.delete();
    res.json({ message: "Vision deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
