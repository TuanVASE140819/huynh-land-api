const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const COLLECTION = "properties";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// Lấy danh sách bất động sản (GET /api/property?lang=vi)
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const snapshot = await admin.firestore().collection(COLLECTION).where("lang", "==", lang).get();
    const properties = [];
    snapshot.forEach(doc => properties.push({ id: doc.id, ...doc.data() }));
    res.json({ properties });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy chi tiết 1 bất động sản (GET /api/property/:id?lang=vi)
router.get("/:id", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const doc = await admin.firestore().collection(COLLECTION).doc(req.params.id + "_" + lang).get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });
    res.json({ property: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo mới bất động sản (POST /api/property?lang=vi)
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });

    const {
      name, address, code, hashtags, price, area, landArea,
      bedrooms, bathrooms, description, highlights, extras, mapLocation
    } = req.body;

    if (!name || !address || !code || !price || !area || !landArea) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Kiểm tra trùng mã bất động sản cho ngôn ngữ đó
    const docId = code + "_" + lang;
    const docRef = admin.firestore().collection(COLLECTION).doc(docId);
    const doc = await docRef.get();
    if (doc.exists)
      return res.status(400).json({ message: "Property code already exists." });

    await docRef.set({
      lang,
      name,
      address,
      code,
      hashtags: hashtags || [],
      price,
      area,
      landArea,
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      description: description || "",
      highlights: highlights || [],
      extras: extras || [],
      mapLocation: mapLocation || null
    });

    res.status(201).json({
      message: "Property created.",
      property: {
        lang, name, address, code, hashtags, price, area, landArea,
        bedrooms, bathrooms, description, highlights, extras, mapLocation
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa bất động sản (PUT /api/property/:id?lang=vi)
router.put("/:id", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docId = req.params.id + "_" + lang;
    const docRef = admin.firestore().collection(COLLECTION).doc(docId);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Property updated.", property: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa bất động sản (DELETE /api/property/:id?lang=vi)
router.delete("/:id", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docId = req.params.id + "_" + lang;
    const docRef = admin.firestore().collection(COLLECTION).doc(docId);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });
    await docRef.delete();
    res.json({ message: "Property deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
