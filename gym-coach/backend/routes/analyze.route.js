const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const axios = require("axios");

const router = express.Router();
const upload = multer({ dest: "tmp/" });

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8010/analyze";

router.post("/", upload.single("video"), async (req, res) => {
    try {
        const { exercise } = req.body;

        if (!exercise) {
            return res.status(400).json({ error: "Missing 'exercise' field" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Missing 'video' file" });
        }

        const form = new FormData();
        form.append("exercise", exercise);
        form.append("video", fs.createReadStream(req.file.path), {
            filename: "workout.mp4",
            contentType: "video/mp4",
            knownLength: req.file.size,
        });

        const fastapiRes = await axios.post(FASTAPI_URL, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        fs.unlink(req.file.path, () => {});

        return res.json(fastapiRes.data);
    } catch (err) {
        if (req.file?.path) fs.unlink(req.file.path, () => {});
        console.error("Analyze proxy error:", err?.response?.data ?? err.message);
        return res.status(err?.response?.status ?? 500).json({
            error: err?.response?.data ?? err.message,
        });
    }
});

module.exports = router;