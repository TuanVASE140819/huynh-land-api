const express = require("express");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./routes/user.routes"); // Đảm bảo file này tồn tại: src/routes/user.routes.js
const historyRoutes = require("./routes/history.routes");
const missionRoutes = require("./routes/mission.routes");
const visionRoutes = require("./routes/vision.routes");
const contactRoutes = require("./routes/contact.routes");
const officeRoutes = require("./routes/office.routes");
const socialRoutes = require("./routes/social.routes");
const mainOfficeMapRoutes = require("./routes/mainoffice-map.routes");
const logger = require("./utils/logger");
const admin = require("./config/firebase"); // Sử dụng config chuẩn

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

// Chỉ load Swagger khi file tồn tại
const fs = require("fs");
if (fs.existsSync("./swagger/swagger.yaml")) {
  const YAML = require("yamljs");
  const swaggerDocument = YAML.load("./swagger/swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get("/", (req, res) => {
  res.send("Huynh Land Firebase API");
});

module.exports = app;
