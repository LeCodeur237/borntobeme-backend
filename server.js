require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const dbPool = require("./db"); // Import the pool from db.js
const fs = require("fs"); // Moved fs import higher for clarity

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://149.102.137.13:8080",
      "https://149.102.137.13:8080",
      "http://born-to-be-me.com",
      "https://born-to-be-me.com",
      "http://www.born-to-be-me.com",
      "https://www.born-to-be-me.com",
      "http://localhost:5173",
      "https://localhost:5173"
    ],
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" })); // Consolidated and placed before routes
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Placed before routes

const PORT = process.env.PORT || 8081;
// Define the host for Swagger and informational logs.
// This should be the address clients use to reach the API.
// For local development, 'localhost' is fine. For deployment, set API_HOST in your .env file to the public IP or domain.
const API_HOST = (process.env.API_HOST || "localhost").trim();

// Test MySQL connection (using the imported pool)
dbPool
  .getConnection()
  .then((connection) => {
    console.log("Successfully connected to MySQL database");
    connection.release();
    // The dbPool from './db.js' is now the single source of truth for DB connections.
    // Your route files (authRoutes.js, articleRoutes.js) and controllers
    // should import this pool directly: `const dbPool = require('../db');`
  })
  .catch((err) => {
    console.error("MySQL connection error during initial test:", err.message);
    process.exit(1);
  });

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ConnectBox API with Authentication",
      version: "1.0.0",
      description: "API documentation using Swagger",
    },
    servers: [
      { url: `http://${API_HOST}:${PORT}` },
    ],
  },
  apis: ["./routes/*.js"], // Location of API routes
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Generate and save swagger.json before starting the server
try {
  fs.writeFileSync("./swagger.json", JSON.stringify(swaggerDocs, null, 2));
  console.log("Swagger JSON file generated successfully at ./swagger.json");
} catch (err) {
  console.error("Error writing swagger.json file:", err);
}

// Routes
app.use("/api/borntobeme/auth", authRoutes);
app.use("/api/borntobeme/articles", articleRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Swagger documentation available at http://${API_HOST}:${PORT}/api-docs`
  );
});
