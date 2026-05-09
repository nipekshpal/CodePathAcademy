const db = require("../config/db");

// ─── Helper: Convert any YouTube URL to embed format ────────────────────────
//
// Handles:
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
//   https://www.youtube.com/embed/VIDEO_ID  (already embedded — pass through)
//   https://www.youtube.com/watch?v=VIDEO_ID&t=30s  (with extra params)
//
// Returns the embed URL string, or null if the input is not a valid YouTube URL.

function toYouTubeEmbedURL(rawURL) {
  if (!rawURL || typeof rawURL !== "string") return null;

  const url = rawURL.trim();

  // Regex captures the 11-character video ID from all common YouTube URL formats.
  // Groups matched (from left to right):
  //   youtu.be/<ID>
  //   /v/<ID>
  //   /u/w/<ID>        (rare channel redirect format)
  //   /embed/<ID>      (already an embed URL — pass through cleanly)
  //   watch?v=<ID>
  //   &v=<ID>          (edge case in some sharing links)
  const regex =
    /(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=))([A-Za-z0-9_-]{11})/;

  const match = url.match(regex);

  if (!match || !match[1]) return null;

  const videoId = match[1];
  return `https://www.youtube.com/embed/${videoId}`;
}

// ─── GET /api/videos — All videos ───────────────────────────────────────────
exports.getAllVideos = (req, res) => {
  const sql = "SELECT * FROM videos";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error while fetching videos",
        error: err,
      });
    }

    // Convert every video_url to embed format before sending to the frontend.
    // If a URL is invalid/missing, embed_url is set to null so the frontend
    // can handle it gracefully (e.g. show a fallback message).
    const videos = results.map((video) => ({
      ...video,
      embed_url: toYouTubeEmbedURL(video.video_url),
    }));

    res.status(200).json({
      success: true,
      data: videos,
    });
  });
};

// ─── GET /api/videos/:id — Single video by ID ───────────────────────────────
exports.getVideoById = (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      success: false,
      message: "A valid numeric video ID is required",
    });
  }

  const sql = "SELECT * FROM videos WHERE id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error while fetching video",
        error: err,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No video found with ID ${id}`,
      });
    }

    const video = results[0];

    res.status(200).json({
      success: true,
      data: {
        ...video,
        embed_url: toYouTubeEmbedURL(video.video_url),
      },
    });
  });
};
