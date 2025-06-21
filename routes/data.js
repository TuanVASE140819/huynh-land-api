const express = require("express");
const router = express.Router();

/**
 * @swagger
 * /api/data:
 *   post:
 *     summary: Thêm dữ liệu vào Firestore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   get:
 *     summary: Lấy danh sách dữ liệu từ Firestore
 *     responses:
 *       200:
 *         description: Danh sách dữ liệu
 */
module.exports = (db) => {
  return router;
};
