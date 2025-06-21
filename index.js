const express = require("express");
const admin = require("firebase-admin");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const settingsRoute = require("./routes/settings");
const propertiesRoute = require("./routes/properties");

const app = express();
app.use(express.json());

const serviceAccount = require("./firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", settingsRoute(db));
app.use("/api", propertiesRoute(db));

app.listen(8080, () => {
  console.log("Server chạy tại http://localhost:8080/api-docs");
});
