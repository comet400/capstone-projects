// routes/analyze.route.js
// Proxies multipart video upload from the mobile app → FastAPI

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "tmp/" });

// Update if FastAPI runs on a different host/port
const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000/analyze";

router.post("/", upload.single("video"), async (req, res) => {
    try {
        const { exercise } = req.body;

        if (!exercise) {
            return res.status(400).json({ error: "Missing 'exercise' field" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Missing 'video' file" });
        }

        // Forward to FastAPI as multipart/form-data
        const form = new FormData();
        form.append("exercise", exercise);
        form.append("video", fs.createReadStream(req.file.path), {
            filename: req.file.originalname || "workout.mp4",
            contentType: req.file.mimetype || "video/mp4",
        });

        const fastapiRes = await fetch(FASTAPI_URL, {
            method: "POST",
            body: form,
            headers: form.getHeaders(),
        });

        // Clean up the temp file regardless of outcome
        fs.unlink(req.file.path, () => {});

        if (!fastapiRes.ok) {
            const text = await fastapiRes.text();
            return res.status(fastapiRes.status).json({ error: text });
        }

        const data = await fastapiRes.json();
        return res.json(data);
    } catch (err) {
        // Clean up temp file on error too
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        console.error("Analyze proxy error:", err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;