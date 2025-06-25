const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./routes/user.routes"); // Đảm bảo file này tồn tại: src/routes/user.routes.js
const historyRoutes = require("./routes/history.routes");
const missionRoutes = require("./routes/mission.routes");
const visionRoutes = require("./routes/vision.routes");
const contactRoutes = require("./routes/contact.routes");
const officeRoutes = require("./routes/office.routes");
const socialRoutes = require("./routes/social.routes");
const mainOfficeMapRoutes = require("./routes/mainoffice-map.routes");
const settingsRoutes = require("./routes/settings.routes");
const inforRoutes = require("./routes/infor.routes");
const logger = require("./utils/logger");
const admin = require("./config/firebase"); // Sử dụng config chuẩn
const propertyRoutes = require("./routes/property.routes");
const propertyTypeRoutes = require("./routes/propertyType.routes");

const app = express();

app.use(cors());
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
app.use("/api/settings", settingsRoutes);
app.use("/api/infor", inforRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/property-type", propertyTypeRoutes);

// Chỉ load Swagger khi file tồn tại
const fs = require("fs");
if (fs.existsSync("./swagger/swagger.yaml")) {
  const YAML = require("yamljs");
  const swaggerDocument = YAML.load("./swagger/swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get("/", (req, res) => {
  res.send({
    vi: "Huynh Land Firebase API",
    en: "Huynh Land Firebase API",
    ko: "Huynh Land Firebase API",
  });
});

module.exports = app;
