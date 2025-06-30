const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const multer = require("multer");
const { Dropbox } = require("dropbox");
const fetch = require("node-fetch");

// Firestore collection name
const COLLECTION = "histories";

function getLang(req) {
  const lang = (req.query.lang || "vi").toLowerCase();
  if (!["vi", "en", "ko"].includes(lang)) return null;
  return lang;
}

// Dropbox config
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
const dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN, fetch });
const upload = multer({ storage: multer.memoryStorage() });

// Hàm lấy access_token mới từ refresh_token (nếu cần)
async function getDropboxAccessToken() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.DROPBOX_REFRESH_TOKEN);
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
  return data.access_token;
}

// ===== HISTORY APIs =====

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

// Tạo thư mục /huynh-land/history trên Dropbox nếu chưa có
async function ensureDropboxHistoryFolder(dbx) {
  const folderPath = "/huynh-land/history";
  try {
    await dbx.filesGetMetadata({ path: folderPath });
  } catch (error) {
    if (error.status === 409) {
      // Folder chưa tồn tại, tạo mới
      await dbx.filesCreateFolderV2({ path: folderPath, autorename: false });
    } else {
      throw error;
    }
  }
}

// Upload image to Dropbox (POST /api/history/upload-image)
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    let accessToken = DROPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      accessToken = await getDropboxAccessToken();
    }
    const dbx = new Dropbox({ accessToken, fetch });
    await ensureDropboxHistoryFolder(dbx); // Đảm bảo folder tồn tại
    const dropboxPath = `/huynh-land/history/${Date.now()}_${
      req.file.originalname
    }`;
    let url;
    try {
      await dbx.filesUpload({
        path: dropboxPath,
        contents: req.file.buffer,
        mode: "add",
        autorename: true,
        mute: false,
      });
      // Tạo link chia sẻ
      const shared = await dbx.sharingCreateSharedLinkWithSettings({
        path: dropboxPath,
        settings: { requested_visibility: "public" },
      });
      url = shared.result.url;
    } catch (error) {
      // Nếu link đã tồn tại thì lấy link cũ
      if (error?.error?.shared_link_already_exists) {
        const shared = await dbx.sharingListSharedLinks({
          path: dropboxPath,
          direct_only: true,
        });
        if (shared.result.links && shared.result.links.length > 0) {
          url = shared.result.links[0].url;
        } else {
          return res
            .status(500)
            .json({ message: "No shared link found.", error });
        }
      } else {
        return res.status(500).json({
          message: "Upload failed",
          error: error.message,
          details: error,
        });
      }
    }
    // Chuyển link về direct link cho <img>
    if (url.includes("/scl/")) {
      url = url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace(/\?dl=0$/, "");
    } else {
      url = url.replace("?dl=0", "?raw=1");
    }
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// Lấy ảnh lịch sử (GET /api/history/image)
router.get("/image", async (req, res) => {
  try {
    let accessToken = DROPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      accessToken = await getDropboxAccessToken();
    }
    const dbx = new Dropbox({ accessToken, fetch });
    const folderPath = "/huynh-land/history";
    // Lấy tất cả file trong folder
    const list = await dbx.filesListFolder({
      path: folderPath,
      recursive: false,
    });
    const files = (list.result.entries || []).filter(
      (e) => e[".tag"] === "file"
    );
    if (files.length === 0) {
      return res.status(404).json({ message: "No history image found." });
    }
    // Lấy file mới nhất
    const file = files.sort(
      (a, b) => new Date(b.server_modified) - new Date(a.server_modified)
    )[0];
    let url;
    try {
      const shared = await dbx.sharingCreateSharedLinkWithSettings({
        path: file.path_display,
        settings: { requested_visibility: "public" },
      });
      url = shared.result.url;
    } catch (error) {
      // Xử lý lỗi shared_link_already_exists cho mọi trường hợp trả về
      const tag =
        error?.error?.[".tag"] ||
        error?.error?.error?.[".tag"] ||
        error?.error?.error_summary;
      if (
        tag === "shared_link_already_exists" ||
        (typeof tag === "string" && tag.includes("shared_link_already_exists"))
      ) {
        const shared = await dbx.sharingListSharedLinks({
          path: file.path_display,
          direct_only: true,
        });
        // Kiểm tra cả shared.links và shared.result.links
        const links =
          shared.links || (shared.result && shared.result.links) || [];
        if (links.length > 0) {
          url = links[0].url;
        } else {
          return res
            .status(404)
            .json({ message: "No shared link found for this file." });
        }
      } else {
        return res.status(500).json({
          message: "Get image link failed",
          error: error.message,
          details: error,
        });
      }
    }
    // Chuyển link về direct link cho <img>
    if (url.includes("/scl/")) {
      url = url
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace(/\?dl=0$/, "");
    } else {
      url = url.replace("?dl=0", "?raw=1");
    }
    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
// ===== PROPERTY TYPE APIs =====

// Thêm loại bất động sản (POST /api/property-type)
router.post("/property-type", async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !description || typeof status === "undefined") {
      return res
        .status(400)
        .json({ message: "Missing name, description, or status." });
    }
    // Tên loại duy nhất
    const query = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .where("name", "==", name)
      .get();
    if (!query.empty) {
      return res
        .status(400)
        .json({ message: "Property type with this name already exists." });
    }
    const docRef = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .add({
        name,
        description,
        status,
      });
    res.status(201).json({
      message: "Property type created.",
      id: docRef.id,
      propertyType: { name, description, status },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Sửa loại bất động sản (PUT /api/property-type/:id)
router.put("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    if (!name && !description && typeof status === "undefined") {
      return res.status(400).json({ message: "Missing fields to update." });
    }
    const docRef = admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    await docRef.update({
      ...(name && { name }),
      ...(description && { description }),
      ...(typeof status !== "undefined" && { status }),
    });
    const updated = await docRef.get();
    res.json({
      message: "Property type updated.",
      propertyType: updated.data(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Xóa loại bất động sản (DELETE /api/property-type/:id)
router.delete("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    await docRef.delete();
    res.json({ message: "Property type deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy danh sách loại bất động sản (GET /api/property-type)
router.get("/property-type", async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .get();
    const propertyTypes = [];
    snapshot.forEach((doc) => {
      propertyTypes.push({ id: doc.id, ...doc.data() });
    });
    res.json({ propertyTypes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Lấy chi tiết loại bất động sản (GET /api/property-type/:id)
router.get("/property-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await admin
      .firestore()
      .collection(PROPERTY_TYPE_COLLECTION)
      .doc(id)
      .get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Property type not found." });
    }
    res.json({ propertyType: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
