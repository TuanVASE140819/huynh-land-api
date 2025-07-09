const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const COLLECTION = "contactMessages";

// Gửi tin nhắn liên hệ (POST /api/contact-message)
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    const docRef = await admin
      .firestore()
      .collection(COLLECTION)
      .add({
        name,
        phone,
        email: email || null,
        subject: subject || null,
        message,
        createdAt: new Date(),
      });
    res.status(201).json({ message: "Message sent.", id: docRef.id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy danh sách tin nhắn liên hệ (GET /api/contact-message)
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
