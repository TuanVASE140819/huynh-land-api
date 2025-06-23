require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 8012; // đổi sang cổng khác nếu 8011 bị chiếm
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
