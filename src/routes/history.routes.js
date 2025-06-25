const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection name
const COLLECTION = "histories";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// ===== HISTORY APIs =====

// Thêm lịch sử (POST /api/history?lang=vi)
router.post("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (doc.exists)
      return res
        .status(400)
        .json({ message: "History already exists for this language." });

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.set({ title, content });
    res
      .status(201)
      .json({ message: "History created.", history: { title, content } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa lịch sử (PUT /api/history?lang=vi)
router.put("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No history to update for this language." });

    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ message: "Missing title or content." });
    }

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "History updated.", history: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa lịch sử (DELETE /api/history?lang=vi)
router.delete("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const docRef = admin.firestore().collection(COLLECTION).doc(lang);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No history to delete for this language." });
    await docRef.delete();
    res.json({ message: "History deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Hiển thị lịch sử (GET /api/history?lang=vi)
router.get("/", async (req, res) => {
  try {
    const lang = getLang(req);
    if (!lang) return res.status(400).json({ message: "Invalid language." });
    const doc = await admin.firestore().collection(COLLECTION).doc(lang).get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No history found for this language." });
    res.json({ history: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
// ===== PROPERTY TYPE APIs =====

// Thêm loại bất động sản (POST /api/property-type)
router.post("/property-type", async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !description || typeof status === "undefined") {
      return res
        .status(400)
        .json({ message: "Missing name, description, or status." });
    }
    // Tên loại duy nhất
    const query = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .where("name", "==", name)
      .get();
    if (!query.empty) {
      return res
        .status(400)
        .json({ message: "Property type with this name already exists." });
    }
    const docRef = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .add({
        name,
        description,
        status,
      });
    res.status(201).json({
      message: "Property type created.",
      id: docRef.id,
      propertyType: { name, description, status },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa loại bất động sản (PUT /api/property-type/:id)
router.put("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    if (!name && !description && typeof status === "undefined") {
      return res.status(400).json({ message: "Missing fields to update." });
    }
    const docRef = admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    await docRef.update({
      ...(name && { name }),
      ...(description && { description }),
      ...(typeof status !== "undefined" && { status }),
    });
    const updated = await docRef.get();
    res.json({
      message: "Property type updated.",
      propertyType: updated.data(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa loại bất động sản (DELETE /api/property-type/:id)
router.delete("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    await docRef.delete();
    res.json({ message: "Property type deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy danh sách loại bất động sản (GET /api/property-type)
router.get("/property-type", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .get();
    const propertyTypes = [];
    snapshot.forEach((doc) => {
      propertyTypes.push({ id: doc.id, ...doc.data() });
    });
    res.json({ propertyTypes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy chi tiết loại bất động sản (GET /api/property-type/:id)
router.get("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id)
      .get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    res.json({ propertyType: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
