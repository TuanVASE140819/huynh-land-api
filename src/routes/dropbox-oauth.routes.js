const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID || "o4tp0epqnimyc0i";
const DROPBOX_CLIENT_SECRET =
  process.env.DROPBOX_CLIENT_SECRET || "xzdlw5mzulj2qib";
const DROPBOX_REDIRECT_URI =
  process.env.DROPBOX_REDIRECT_URI || "http://localhost:3000/redirect";

// Đổi code lấy access_token + refresh_token
router.post("/api/dropbox/token", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("grant_type", "authorization_code");
  params.append("client_id", DROPBOX_CLIENT_ID);
  params.append("client_secret", DROPBOX_CLIENT_SECRET);
  params.append("redirect_uri", DROPBOX_REDIRECT_URI);

  try {
    const response = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await response.json();
    if (data.error) return res.status(400).json(data);
    console.log("Dropbox token response:", data); // Thêm log chi tiết
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      uid: data.uid,
      account_id: data.account_id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi refresh_token lấy access_token mới
router.post("/api/dropbox/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token)
    return res.status(400).json({ error: "Missing refresh_token" });

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  params.append("client_id", DROPBOX_CLIENT_ID);
  params.append("client_secret", DROPBOX_CLIENT_SECRET);

  try {
    const response = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await response.json();
    if (data.error) return res.status(400).json(data);
    console.log("Dropbox token response:", data); // Thêm log chi tiết
    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
