const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const multer = require("multer");
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch"); // Dropbox SDK cần fetch

const COLLECTION = "properties";
const LANGS = ["vi", "en", "ko"];

// Dropbox config
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });

console.log("Dropbox initialized with access token:", DROPBOX_ACCESS_TOKEN);
// Multer config (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Lấy danh sách bất động sản (GET /api/property)
router.get("/", async (req, res) => {
  try {
    const { propertyType, businessType, address, priceFrom, priceTo, keyword, status } = req.query;
    let query = admin.firestore().collection(COLLECTION);

    if (propertyType) {
      query = query.where("propertyType", "==", propertyType);
    }
    if (businessType) {
      query = query.where("businessType", "==", businessType);
    }

    if (priceFrom && priceTo) {
      if (Number(priceFrom) > Number(priceTo)) {
        return res.json({ properties: [] });
      }
      query = query
        .where("vi.price", ">=", Number(priceFrom))
        .where("vi.price", "<=", Number(priceTo));
    } else if (priceFrom) {
      query = query.where("vi.price", ">=", Number(priceFrom));
    } else if (priceTo) {
      query = query.where("vi.price", "<=", Number(priceTo));
    }

    const snapshot = await query.get();
    let properties = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      properties.push({
        id: doc.id,
        vi: {
          ...(data.vi || {}),
          floors: (data.vi && data.vi.floors) || null,
          direction: (data.vi && data.vi.direction) || null,
        },
        en: {
          ...(data.en || {}),
          floors: (data.en && data.en.floors) || null,
          direction: (data.en && data.en.direction) || null,
        },
        ko: {
          ...(data.ko || {}),
          floors: (data.ko && data.ko.floors) || null,
          direction: (data.ko && data.ko.direction) || null,
        },
        images: Array.isArray(data.images) ? data.images : [],
        propertyType: data.propertyType || null,
        businessType: data.businessType || null,
        status: data.status || "active",
      });
    });

    // Bỏ lọc theo status, luôn trả về tất cả property

    // Lọc theo address (tìm kiếm chuỗi, đa ngôn ngữ)
    if (address) {
      const addr = address.toLowerCase();
      properties = properties.filter(
        (p) =>
          (p.vi.address && p.vi.address.toLowerCase().includes(addr)) ||
          (p.en.address && p.en.address.toLowerCase().includes(addr)) ||
          (p.ko.address && p.ko.address.toLowerCase().includes(addr))
      );
    }

    // Lọc theo keyword (tìm trong name, description, đa ngôn ngữ)
    if (keyword) {
      const kw = keyword.toLowerCase();
      properties = properties.filter(
        (p) =>
          (p.vi.name && p.vi.name.toLowerCase().includes(kw)) ||
          (p.vi.description && p.vi.description.toLowerCase().includes(kw)) ||
          (p.en.name && p.en.name.toLowerCase().includes(kw)) ||
          (p.en.description && p.en.description.toLowerCase().includes(kw)) ||
          (p.ko.name && p.ko.name.toLowerCase().includes(kw)) ||
          (p.ko.description && p.ko.description.toLowerCase().includes(kw))
      );
    }

    res.json({ properties });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy chi tiết 1 bất động sản (GET /api/property/:id)
router.get("/:id", async (req, res) => {
  try {
    const doc = await admin
      .firestore()
      .collection(COLLECTION)
      .doc(req.params.id)
      .get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });
    const data = doc.data();
    res.json({
      property: {
        id: doc.id,
        vi: {
          ...(data.vi || {}),
          floors: (data.vi && data.vi.floors) || null,
          direction: (data.vi && data.vi.direction) || null,
        },
        en: {
          ...(data.en || {}),
          floors: (data.en && data.en.floors) || null,
          direction: (data.en && data.en.direction) || null,
        },
        ko: {
          ...(data.ko || {}),
          floors: (data.ko && data.ko.floors) || null,
          direction: (data.ko && data.ko.direction) || null,
        },
        images: Array.isArray(data.images) ? data.images : [],
        propertyType: data.propertyType || null,
        businessType: data.businessType || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Tạo mới bất động sản (POST /api/property)
router.post("/", async (req, res) => {
  try {
    const { vi, en, ko, images, propertyType, businessType } = req.body;
    if (
      !vi ||
      !en ||
      !ko ||
      !propertyType ||
      !vi.name ||
      !vi.address ||
      !vi.code ||
      !vi.price ||
      !vi.area ||
      !vi.landArea ||
      !en.name ||
      !en.address ||
      !en.code ||
      !en.price ||
      !en.area ||
      !en.landArea ||
      !ko.name ||
      !ko.address ||
      !ko.code ||
      !ko.price ||
      !ko.area ||
      !ko.landArea
    ) {
      return res.status(400).json({
        message:
          "Missing required fields in one of the languages or propertyType.",
      });
    }

    const query = await admin
      .firestore()
      .collection(COLLECTION)
      .where("vi.code", "==", vi.code)
      .get();
    if (!query.empty)
      return res
        .status(400)
        .json({ message: "Property code already exists (vi)." });

    const imagesArr = Array.isArray(images) ? images : [];

    // floors là optional, không cần ép kiểu ở đây

    const docRef = await admin
      .firestore()
      .collection(COLLECTION)
      .add({ vi, en, ko, images: imagesArr, propertyType, businessType, status: "active" });
    res.status(201).json({
      message: "Property created.",
      property: {
        id: docRef.id,
        vi: {
          ...vi,
          floors: vi.floors || null,
          direction: vi.direction || null,
        },
        en: {
          ...en,
          floors: en.floors || null,
          direction: en.direction || null,
        },
        ko: {
          ...ko,
          floors: ko.floors || null,
          direction: ko.direction || null,
        },
        images: imagesArr,
        propertyType,
        businessType: businessType || null,
        status: "active",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa bất động sản (PUT /api/property/:id)
router.put("/:id", async (req, res) => {
  try {
    const { vi, en, ko, images, propertyType, businessType } = req.body;
    if (
      !vi &&
      !en &&
      !ko &&
      images === undefined &&
      propertyType === undefined
    ) {
      return res.status(400).json({ message: "Missing fields to update." });
    }
    const docRef = admin.firestore().collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });

    const updateData = {};
    if (vi) updateData.vi = { ...(doc.data().vi || {}), ...vi };
    if (en) updateData.en = { ...(doc.data().en || {}), ...en };
    if (ko) updateData.ko = { ...(doc.data().ko || {}), ...ko };
    if (images !== undefined)
      updateData.images = Array.isArray(images)
        ? images
        : doc.data().images || [];
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (businessType !== undefined) updateData.businessType = businessType;

    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json({
      message: "Property updated.",
      property: {
        id: updated.id,
        vi: {
          ...(updated.data().vi || {}),
          floors: (updated.data().vi && updated.data().vi.floors) || null,
          direction: (updated.data().vi && updated.data().vi.direction) || null,
        },
        en: {
          ...(updated.data().en || {}),
          floors: (updated.data().en && updated.data().en.floors) || null,
          direction: (updated.data().en && updated.data().en.direction) || null,
        },
        ko: {
          ...(updated.data().ko || {}),
          floors: (updated.data().ko && updated.data().ko.floors) || null,
          direction: (updated.data().ko && updated.data().ko.direction) || null,
        },
        images: Array.isArray(updated.data().images)
          ? updated.data().images
          : [],
        propertyType: updated.data().propertyType || null,
        businessType: updated.data().businessType || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// API cập nhật trạng thái ẩn/hiện bất động sản
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["active", "hidden"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'active' or 'hidden'." });
    }
    const docRef = admin.firestore().collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Property not found." });
    await docRef.update({ status });
    res.json({ message: `Property status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa bất động sản (DELETE /api/property/:id)
router.delete("/:id", async (req, res) => {
  try {
    const docRef = admin.firestore().collection(COLLECTION).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists)
      return res.status(404).json({ message: "Property not found." });
    await docRef.delete();
    res.json({ message: "Property deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Hàm lấy access_token mới từ refresh_token
async function getDropboxAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.DROPBOX_REFRESH_TOKEN); // refresh_token bạn lấy được
  params.append(
    "client_id",
    process.env.DROPBOX_CLIENT_ID || "o4tp0epqnimyc0i"
  );
  params.append(
    "client_secret",
    process.env.DROPBOX_CLIENT_SECRET || "xzdlw5mzulj2qib"
  );

  const response = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const data = await response.json();
  console.log("Dropbox token response:", data); // Thêm log chi tiết
  return data.access_token;
}

// Upload image to Dropbox (POST /api/property/upload-image)
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const accessToken = await getDropboxAccessToken();
    console.log("Access token:", accessToken);
    const dbx = new Dropbox({ accessToken, fetch });
    const dropboxPath = `/huynh-land/${Date.now()}_${req.file.originalname}`;
    try {
      const uploadRes = await dbx.filesUpload({
        path: dropboxPath,
        contents: req.file.buffer,
        mode: "add",
        autorename: true,
        mute: false,
      });
      const shared = await dbx.sharingCreateSharedLinkWithSettings({
        path: dropboxPath,
        settings: { requested_visibility: "public" },
      });
      // Lấy link thumbnail (preview) cho ảnh Dropbox
      const thumbnailRes = await dbx.filesGetThumbnailV2({
        resource: {
          ".tag": "path",
          path: dropboxPath,
        },
        format: { ".tag": "png" },
        size: { ".tag": "w640h480" },
      });
      let url;
      if (thumbnailRes.result && thumbnailRes.result.thumbnail) {
        const thumbBase64 = thumbnailRes.result.thumbnail.toString("base64");
        url = `data:image/png;base64,${thumbBase64}`;
      } else {
        // Fallback: xử lý link raw Dropbox
        url = shared.result.url;
        if (url.includes("/scl/")) {
          url = url
            .replace("www.dropbox.com", "dl.dropboxusercontent.com")
            .replace("?dl=0", "");
        } else {
          url = url.replace("?dl=0", "?raw=1");
        }
      }
      res.json({ url });
    } catch (error) {
      console.error("Dropbox error:", error);
      if (error.error && error.error.shared_link_already_exists) {
        const shared = await dbx.sharingListSharedLinks({
          path: dropboxPath,
          direct_only: true,
        });
        let url = shared.result.url;
        // Xử lý link Dropbox mới (Scoped Link) thành link raw trực tiếp
        if (url.includes("/scl/")) {
          url = url
            .replace("www.dropbox.com", "dl.dropboxusercontent.com")
            .replace("?dl=0", "");
        } else {
          url = url.replace("?dl=0", "?raw=1");
        }
        res.json({ url });
      }
      res.status(500).json({
        message: "Upload failed",
        error: error.message,
        details: error,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

module.exports = router;
