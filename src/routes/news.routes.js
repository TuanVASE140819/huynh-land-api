const express = require("express");
const router = express.Router();
const NewsService = require("../services/news.service");

// GET /api/news - list all news, with optional search by title
router.get("/", async (req, res) => {
  try {
    const { title } = req.query;
    const news = await NewsService.getAll(title);
    res.json({ news });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/news/:id - get news by id
router.get("/:id", async (req, res) => {
  try {
    const item = await NewsService.getById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/news - create news
router.post("/", async (req, res) => {
  try {
    const { title, summary, content, author, date } = req.body;
    const newItem = await NewsService.create({
      title,
      summary,
      content,
      author,
      date,
    });
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /api/news/:id - update news
router.put("/:id", async (req, res) => {
  try {
    const updated = await NewsService.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/news/:id - delete news
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await NewsService.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/news/latest - get the latest news
router.get("/latest", async (req, res) => {
  try {
    const latest = await NewsService.getLatest();
    if (!latest) return res.status(404).json({ message: "Not found" });
    res.json({ news: latest });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
