const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Lấy danh sách Properties
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: Danh sách Properties
 *   post:
 *     summary: Thêm mới Property
 *     tags:
 *       - Properties
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: object
 *                 properties:
 *                   vi: { type: string }
 *                   en: { type: string }
 *                   ko: { type: string }
 *               price: { type: string }
 *               priceUSD: { type: string }
 *               priceKRW: { type: string }
 *               location:
 *                 type: object
 *                 properties:
 *                   vi: { type: string }
 *                   en: { type: string }
 *                   ko: { type: string }
 *               area: { type: string }
 *               bedrooms: { type: integer }
 *               bathrooms: { type: integer }
 *               image: { type: string }
 *               type:
 *                 type: object
 *                 properties:
 *                   vi: { type: string }
 *                   en: { type: string }
 *                   ko: { type: string }
 *               description:
 *                 type: object
 *                 properties:
 *                   vi: { type: string }
 *                   en: { type: string }
 *                   ko: { type: string }
 *               floors: { type: integer }
 *               direction:
 *                 type: object
 *                 properties:
 *                   vi: { type: string }
 *                   en: { type: string }
 *                   ko: { type: string }
 *               features:
 *                 type: object
 *                 properties:
 *                   vi:
 *                     type: array
 *                     items: { type: string }
 *                   en:
 *                     type: array
 *                     items: { type: string }
 *                   ko:
 *                     type: array
 *                     items: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 */
module.exports = (db) => {
  router.get("/properties", async (req, res) => {
    try {
      const snapshot = await db.collection("properties").get();
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/properties", async (req, res) => {
    try {
      const data = req.body;
      const ref = await db.collection("properties").add({
        ...data,
        floors: data.floors,
        direction: data.direction,
        features: data.features,
      });
      res.json({ id: ref.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * @swagger
   * /api/properties/search:
   *   get:
   *     summary: Tìm kiếm Properties với filter
   *     tags:
   *       - Properties
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Loại căn hộ (Land, Apartment, ...)
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *         description: Vị trí (District, City, ...)
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Giá tối thiểu (VND)
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Giá tối đa (VND)
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: Từ khóa tìm kiếm
   *     responses:
   *       200:
   *         description: Danh sách kết quả tìm kiếm
   */
  router.get("/properties/search", async (req, res) => {
    try {
      let query = db.collection("properties");
      const { type, location, minPrice, maxPrice, keyword } = req.query;
      if (type) query = query.where("type.vi", "==", type);
      if (location) query = query.where("location.vi", "==", location);
      // Giá dạng text, cần chuyển về số để so sánh nếu dữ liệu chuẩn
      let results = (await query.get()).docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (minPrice)
        results = results.filter(
          (p) =>
            parseFloat((p.price || "").replace(/[^\d.]/g, "")) >=
            parseFloat(minPrice)
        );
      if (maxPrice)
        results = results.filter(
          (p) =>
            parseFloat((p.price || "").replace(/[^\d.]/g, "")) <=
            parseFloat(maxPrice)
        );
      if (keyword) {
        const kw = keyword.toLowerCase();
        results = results.filter(
          (p) =>
            p.title?.vi?.toLowerCase().includes(kw) ||
            p.title?.en?.toLowerCase().includes(kw) ||
            p.title?.ko?.toLowerCase().includes(kw) ||
            p.description?.vi?.toLowerCase().includes(kw) ||
            p.description?.en?.toLowerCase().includes(kw) ||
            p.description?.ko?.toLowerCase().includes(kw)
        );
      }
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * @swagger
   * /api/properties/{id}:
   *   delete:
   *     summary: Xóa property theo id
   *     tags:
   *       - Properties
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID của property
   *     responses:
   *       200:
   *         description: Xóa thành công
   *       404:
   *         description: Không tìm thấy property
   */
  router.delete("/properties/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ref = db.collection("properties").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Property not found" });
      }
      await ref.delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
