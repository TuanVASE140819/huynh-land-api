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
