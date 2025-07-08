const express = require("express");
const router = express.Router();

// GET /api/new
router.get("/", (req, res) => {
  res.json({
    message: "This is the new API endpoint!"
  });
});

module.exports = router;
