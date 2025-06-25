const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const PROPERTY_TYPE_COLLECTION = "property_types";
const LANGS = ["vi", "en", "ko"];

// Thêm loại bất động sản (POST /api/property-type)
router.post("/", async (req, res) => {
  try {
    const { vi, en, ko, status } = req.body;
    if (
      !vi ||
      !en ||
      !ko ||
      !vi.name ||
      !vi.description ||
      !en.name ||
      !en.description ||
      !ko.name ||
      !ko.description ||
      typeof status === "undefined"
    ) {
      return res.status(400).json({
        message:
          "Missing name or description in one of the languages, or missing status.",
      });
    }
    // Kiểm tra tên loại duy nhất cho từng ngôn ngữ (ví dụ với tiếng Việt)
    const query = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .where("vi.name", "==", vi.name)
      .get();
    if (!query.empty) {
      return res.status(400).json({
        message: "Property type with this Vietnamese name already exists.",
      });
    }
    // Thêm mới
    const docRef = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .add({ vi, en, ko, status });
    res.status(201).json({
      message: "Property type created.",
      id: docRef.id,
      propertyType: { vi, en, ko, status },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa loại bất động sản (PUT /api/property-type/:id)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { vi, en, ko, status } = req.body;
    if (!vi && !en && !ko && typeof status === "undefined") {
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
    const updateData = {};
    if (vi) {
      if (vi.name) updateData["vi.name"] = vi.name;
      if (vi.description) updateData["vi.description"] = vi.description;
    }
    if (en) {
      if (en.name) updateData["en.name"] = en.name;
      if (en.description) updateData["en.description"] = en.description;
    }
    if (ko) {
      if (ko.name) updateData["ko.name"] = ko.name;
      if (ko.description) updateData["ko.description"] = ko.description;
    }
    if (typeof status !== "undefined") updateData.status = status;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }
    await docRef.update(updateData);
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
router.delete("/:id", async (req, res) => {
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
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .get();
    const propertyTypes = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Đảm bảo trả về đúng mẫu: { vi, en, ko, status }
      propertyTypes.push({
        id: doc.id,
        vi: data.vi || {},
        en: data.en || {},
        ko: data.ko || {},
        status: typeof data.status !== "undefined" ? data.status : true,
      });
    });
    res.json({ propertyTypes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy chi tiết loại bất động sản (GET /api/property-type/:id?lang=vi)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const lang = (req.query.lang || "vi").toLowerCase();
    if (!LANGS.includes(lang)) {
      return res.status(400).json({ message: "Invalid language." });
    }
    const doc = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id)
      .get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    const data = doc.data();
    if (!data[lang]) {
      return res.status(404).json({
        message: "Property type not found in this language.",
      });
    }
    res.json({ propertyType: { id: doc.id, ...data[lang] } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
