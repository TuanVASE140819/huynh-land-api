const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Lấy thông tin SEO đa ngôn ngữ
 *     tags:
 *       - Settings
 *     responses:
 *       200:
 *         description: Thông tin SEO đa ngôn ngữ
 *   post:
 *     summary: Cập nhật thông tin SEO đa ngôn ngữ
 *     tags:
 *       - Settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vi:
 *                 type: object
 *                 properties:
 *                   brandName:
 *                     type: string
 *                   slogan:
 *                     type: string
 *                   description:
 *                     type: string
 *               en:
 *                 type: object
 *                 properties:
 *                   brandName:
 *                     type: string
 *                   slogan:
 *                     type: string
 *                   description:
 *                     type: string
 *               ko:
 *                 type: object
 *                 properties:
 *                   brandName:
 *                     type: string
 *                   slogan:
 *                     type: string
 *                   description:
 *                     type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
module.exports = (db) => {
  router.get("/settings", async (req, res) => {
    try {
      const doc = await db.collection("settings").doc("seo").get();
      if (!doc.exists) {
        return res.json({
          vi: {},
          en: {},
          ko: {},
          history: { vi: "", en: "", ko: "" },
        });
      }
      res.json(doc.data());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/settings", async (req, res) => {
    try {
      const data = req.body;
      // Đảm bảo có trường history đa ngôn ngữ khi cập nhật
      if (!data.history) data.history = { vi: "", en: "", ko: "" };
      await db.collection("settings").doc("seo").set(data, { merge: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * @swagger
   * /api/history:
   *   get:
   *     summary: Lấy thông tin lịch sử hình thành
   *     tags:
   *       - History
   *     responses:
   *       200:
   *         description: Thông tin lịch sử hình thành
   *   post:
   *     summary: Cập nhật thông tin lịch sử hình thành
   *     tags:
   *       - History
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               vi: { type: string }
   *               en: { type: string }
   *               ko: { type: string }
   *               mission:
   *                 type: object
   *                 properties:
   *                   vi: { type: string }
   *                   en: { type: string }
   *                   ko: { type: string }
   *               vision:
   *                 type: object
   *                 properties:
   *                   vi: { type: string }
   *                   en: { type: string }
   *                   ko: { type: string }
   *               coreValues:
   *                 type: object
   *                 properties:
   *                   vi: { type: string }
   *                   en: { type: string }
   *                   ko: { type: string }
   *               achievements:
   *                 type: object
   *                 properties:
   *                   trustedCustomers:
   *                     type: integer
   *                     description: Số khách hàng tin tưởng
   *                   successfulTransactions:
   *                     type: integer
   *                     description: Số giao dịch thành công
   *                   yearsExperience:
   *                     type: integer
   *                     description: Số năm kinh nghiệm
   *                   satisfiedCustomers:
   *                     type: integer
   *                     description: Số khách hàng hài lòng
   *     responses:
   *       200:
   *         description: Thành công
   */
  router.get("/history", async (req, res) => {
    try {
      const doc = await db.collection("settings").doc("history").get();
      if (!doc.exists) {
        return res.json({
          vi: "",
          en: "",
          ko: "",
          mission: { vi: "", en: "", ko: "" },
          vision: { vi: "", en: "", ko: "" },
          coreValues: { vi: "", en: "", ko: "" },
          achievements: {
            trustedCustomers: 0,
            successfulTransactions: 0,
            yearsExperience: 0,
            satisfiedCustomers: 0
          }
        });
      }
      // Đảm bảo trả về đủ trường nếu thiếu
      const data = doc.data();
      res.json({
        vi: data.vi || "",
        en: data.en || "",
        ko: data.ko || "",
        mission: data.mission || { vi: "", en: "", ko: "" },
        vision: data.vision || { vi: "", en: "", ko: "" },
        coreValues: data.coreValues || { vi: "", en: "", ko: "" },
        achievements: data.achievements || {
          trustedCustomers: 0,
          successfulTransactions: 0,
          yearsExperience: 0,
          satisfiedCustomers: 0
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/history", async (req, res) => {
    try {
      const data = req.body;
      // Đảm bảo có trường mission, vision, coreValues, achievements khi cập nhật
      if (!data.mission) data.mission = { vi: "", en: "", ko: "" };
      if (!data.vision) data.vision = { vi: "", en: "", ko: "" };
      if (!data.coreValues) data.coreValues = { vi: "", en: "", ko: "" };
      if (!data.achievements) data.achievements = {
        trustedCustomers: 0,
        successfulTransactions: 0,
        yearsExperience: 0,
        satisfiedCustomers: 0
      };
      await db.collection("settings").doc("history").set(data, { merge: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
