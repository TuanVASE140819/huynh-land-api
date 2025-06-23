const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection name
const COLLECTION = "offices";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// Hiển thị địa chỉ văn phòng
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const doc = await admin.firestore().collection(COLLECTION).doc(lang).get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No office info found for this language." });
    res.json({ office: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Thêm địa chỉ văn phòng
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (doc.exists)
      return res
        .status(400)
        .json({ message: "Office info already exists for this language." });

    const { name, address, phone, gmail } = req.body;
    if (!name || !address || !phone || !gmail) {
      return res
        .status(400)
        .json({ message: "Missing name, address, phone, or gmail." });
    }

    await docRef.set({ name, address, phone, gmail });
    res
      .status(201)
      .json({
        message: "Office info created.",
        office: { name, address, phone, gmail },
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa địa chỉ văn phòng
router.put("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No office info to update for this language." });

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Office info updated.", office: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa địa chỉ văn phòng
router.delete("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No office info to delete for this language." });
    await docRef.delete();
    res.json({ message: "Office info deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
