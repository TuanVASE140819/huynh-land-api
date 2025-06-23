const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firestore collection and document name
const COLLECTION = "mainoffice_map";
const DOC_ID = "main";

// Lấy thông tin bản đồ văn phòng chính
router.get("/", async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection(COLLECTION)
      .doc(DOC_ID)
      .get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No main office map info found." });
    res.json({ mainOfficeMap: doc.data() });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo thông tin bản đồ văn phòng chính
router.post("/", async (req, res) => {
  try {
    const { address, iframe } = req.body;
    if (!address || !iframe) {
      return res.status(400).json({ message: "Missing address or iframe." });
    }
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (doc.exists)
      return res
        .status(400)
        .json({ message: "Main office map info already exists." });
    await docRef.set({ address, iframe });
    res
      .status(201)
      .json({
        message: "Main office map info created.",
        mainOfficeMap: { address, iframe },
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa thông tin bản đồ văn phòng chính
router.put("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No main office map info to update." });
    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json({
      message: "Main office map info updated.",
      mainOfficeMap: updated.data(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa thông tin bản đồ văn phòng chính
router.delete("/", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(DOC_ID);
    const doc = await docRef.get();
    if (!doc.exists)
      return res
        .status(404)
        .json({ message: "No main office map info to delete." });
    await docRef.delete();
    res.json({ message: "Main office map info deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
