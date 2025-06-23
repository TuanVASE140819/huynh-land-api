const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection and document name
const COLLECTION = "contact";
const DOC_ID = "main";

// Lấy thông tin liên hệ
router.get("/", async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection(COLLECTION)
      .doc(DOC_ID)
      .get();
    if (!doc.exists)
      return res.status(404).json({ message: "No contact info found." });
    res.json({ contact: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo thông tin liên hệ
router.post("/", async (req, res) => {
  try {
    const { hotline, email, workingHours } = req.body;
    if (!hotline || !email || !workingHours) {
      return res
        .status(400)
        .json({ message: "Missing hotline, email, or workingHours." });
    }
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (doc.exists)
      return res.status(400).json({ message: "Contact info already exists." });
    await docRef.set({ hotline, email, workingHours });
    res
      .status(201)
      .json({
        message: "Contact info created.",
        contact: { hotline, email, workingHours },
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa thông tin liên hệ
router.put("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No contact info to update." });
    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({ message: "Contact info updated.", contact: updated.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa thông tin liên hệ
router.delete("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "No contact info to delete." });
    await docRef.delete();
    res.json({ message: "Contact info deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
