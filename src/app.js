const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const userRoutes = require("./routes/user.routes"); // Đảm bảo file này tồn tại: src/routes/user.routes.js
const historyRoutes = require("./routes/history.routes");
const missionRoutes = require("./routes/mission.routes");
const visionRoutes = require("./routes/vision.routes");
const contactRoutes = require("./routes/contact.routes");
const officeRoutes = require("./routes/office.routes");
const socialRoutes = require("./routes/social.routes");
const mainOfficeMapRoutes = require("./routes/mainoffice-map.routes");
const swaggerDocument = YAML.load("./swagger/swagger.yaml");
const logger = require("./utils/logger");
const admin = require("firebase-admin");
const serviceAccount = require("../huynh-lands-firebase-adminsdk-fbsvc-ae2a6b5dbb.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://huynh-lands.firebaseio.com" // Nếu cần dùng Realtime Database
});

const app = express();

app.use(express.json());
app.use(logger);

app.use("/api/users", userRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/mission", missionRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/office", officeRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/mainoffice-map", mainOfficeMapRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.send("Huynh Land Firebase API");
});

module.exports = app;
