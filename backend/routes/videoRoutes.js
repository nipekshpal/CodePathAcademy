const express = require("express");
const router = express.Router();

const videoController = require("../controllers/videoController");

// GET /api/videos       — fetch all videos (with embed_url already converted)
router.get("/videos", videoController.getAllVideos);

// GET /api/videos/:id   — fetch a single video by ID (with embed_url converted)
router.get("/videos/:id", videoController.getVideoById);

module.exports = router;
