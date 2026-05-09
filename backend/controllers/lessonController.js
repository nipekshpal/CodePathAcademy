const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/* ================= HELPER: YouTube URL → Embed URL ================= */
function toEmbedURL(rawURL) {
  if (!rawURL || typeof rawURL !== "string") return null;

  const regex =
    /(?:youtu\.be\/|youtube\.com\/(?:v\/|u\/\w\/|embed\/|watch\?v=|watch\?.+&v=))([A-Za-z0-9_-]{11})/;

  const match = rawURL.trim().match(regex);
  if (!match || !match[1]) return null;

  return `https://www.youtube.com/embed/${match[1]}`;
}

/* ================= ADD LESSON ================= */
exports.addLesson = (req, res) => {
  const { module_id, title, content, video_url } = req.body;

  if (!module_id || !title || !content) {
    return sendError(res, "module_id, title and content are required", 400);
  }

  const query = `
    INSERT INTO lessons (module_id, title, content, video_url)
    VALUES (?, ?, ?, ?)
  `;

  db.query(query, [module_id, title, content, video_url || null], (err, result) => {
    if (err) return sendError(res, err.message, 500);

    return sendSuccess(res, {
      id: result.insertId,
      message: "Lesson added successfully"
    }, 201);
  });
};

/* ================= GET LESSONS BY MODULE ================= */
exports.getLessonsByModule = (req, res) => {
  const { module_id } = req.params;

  const query = `
    SELECT id, title, video_url
    FROM lessons
    WHERE module_id = ?
    ORDER BY id ASC
  `;

  db.query(query, [module_id], (err, results) => {
    if (err) return sendError(res, err.message, 500);

    // Add embed_url to each lesson in the list
    const lessons = results.map(lesson => ({
      ...lesson,
      embed_url: toEmbedURL(lesson.video_url)
    }));

    return sendSuccess(res, lessons);
  });
};

/* ================= GET SINGLE LESSON ================= */
exports.getLessonById = (req, res) => {
  const { lesson_id } = req.params;

  const query = `
    SELECT *
    FROM lessons
    WHERE id = ?
  `;

  db.query(query, [lesson_id], (err, results) => {
    if (err) return sendError(res, err.message, 500);

    if (results.length === 0) {
      return sendError(res, "Lesson not found", 404);
    }

    const lesson = results[0];

    // Add embed_url to the single lesson response
    return sendSuccess(res, {
      ...lesson,
      embed_url: toEmbedURL(lesson.video_url)
    });
  });
};

/* ================= UPDATE LESSON ================= */
exports.updateLesson = (req, res) => {
  const { lesson_id } = req.params;
  const { title, content, video_url } = req.body;

  const query = `
    UPDATE lessons
    SET title = ?, content = ?, video_url = ?
    WHERE id = ?
  `;

  db.query(query, [title, content, video_url, lesson_id], (err, result) => {
    if (err) return sendError(res, err.message, 500);

    return sendSuccess(res, { message: "Lesson updated successfully" });
  });
};

/* ================= DELETE LESSON ================= */
exports.deleteLesson = (req, res) => {
  const { lesson_id } = req.params;

  const query = `DELETE FROM lessons WHERE id = ?`;

  db.query(query, [lesson_id], (err, result) => {
    if (err) return sendError(res, err.message, 500);

    return sendSuccess(res, { message: "Lesson deleted successfully" });
  });
};
