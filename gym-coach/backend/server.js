require("dotenv").config({ path: "./config.env" });

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// ===============================
// Config
// ===============================

const PORT = process.env.PORT || 5825;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8010";

// ===============================
// Health Check (important)
// ===============================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    proxyTarget: FASTAPI_URL,
  });
});

// ===============================
// Proxy: /api/* → FastAPI
// ===============================

app.use(
  "/api",
  createProxyMiddleware({
    target: FASTAPI_URL,
    changeOrigin: true,
    proxyTimeout: 1000 * 60 * 10, // 10 minutes
    timeout: 1000 * 60 * 10,

    // Rewrite:
    // /api/analyze  ->  /analyze
    // /api/analyze/123 -> /analyze/123
    pathRewrite: {
      "^/api": "",
    },

    onError(err, req, res) {
      console.error("Proxy error:", err.message);
      res.status(500).json({ error: "Proxy failure" });
    },
  })
);

// ===============================
// JSON parsing for other routes
// ===============================

app.use(express.json());

// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
  console.log(`🚀 Express running on port ${PORT}`);
  console.log(`🔁 Proxying /api/* → ${FASTAPI_URL}`);
});