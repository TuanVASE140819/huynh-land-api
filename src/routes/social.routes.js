const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection and document name
const COLLECTION = "social";
const DOC_ID = "main";

// Lấy thông tin social
router.get("/", async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection(COLLECTION)
      .doc(DOC_ID)
      .get();
    if (!doc.exists)
      return res.status(404).json({ message: "No social info found." });
    res.json({ social: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo thông tin social
router.post("/", async (req, res) => {
  try {
    const { facebook, youtube } = req.body;
    if (!facebook || !youtube) {
      return res.status(400).json({ message: "Missing facebook or youtube." });
    }
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (doc.exists)
      return res.status(400).json({ message: "Social info already exists." });
    await docRef.set({ facebook, youtube });
    res
      .status(201)
      .json({ message: "Social info created.", social: { facebook, youtube } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa thông tin social
router.put("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No social info to update." });
    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Social info updated.", social: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa thông tin social
router.delete("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No social info to delete." });
    await docRef.delete();
    res.json({ message: "Social info deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
