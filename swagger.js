const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Huynh Land API",
      version: "1.0.0",
      description:
        "<b>Menu:</b><br>- <b>Quản lý SEO</b>: Các API quản lý thông tin SEO, lịch sử hình thành, sứ mệnh, tầm nhìn, giá trị cốt lõi, thành tựu...<br>- <b>Properties</b>: Quản lý bất động sản.",
    },
    tags: [
      {
        name: "SEO",
        description:
          "Quản lý thông tin SEO, lịch sử hình thành, sứ mệnh, tầm nhìn, giá trị cốt lõi, thành tựu...",
      },
      {
        name: "Properties",
        description: "Quản lý bất động sản",
      },
    ],
  },
  apis: ["./index.js", "./routes/*.js"],
};

module.exports = swaggerJSDoc(options);
