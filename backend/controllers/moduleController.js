const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/* ================= ADD MODULE ================= */
exports.addModule = (req, res) => {
  const { course_id, title } = req.body;

  if (!course_id || !title) {
    return sendError(res, "course_id and title are required", 400);
  }

  db.query(
    "INSERT INTO modules (course_id, title) VALUES (?, ?)",
    [course_id, title],
    (err, result) => {
      if (err) return sendError(res, err.message, 500);

      return sendSuccess(res, {
        id: result.insertId,
        message: "Module added successfully"
      }, 201);
    }
  );
};

/* ================= ADD LESSON ================= */
exports.addLesson = (req, res) => {
  const { module_id, title, content, video_url } = req.body;

  if (!module_id || !title || !content) {
    return sendError(res, "module_id, title and content are required", 400);
  }

  db.query(
    "INSERT INTO lessons (module_id, title, content, video_url) VALUES (?, ?, ?, ?)",
    [module_id, title, content, video_url || null],
    (err, result) => {
      if (err) return sendError(res, err.message, 500);

      return sendSuccess(res, {
        id: result.insertId,
        message: "Lesson added successfully"
      }, 201);
    }
  );
};

/* ================= GET MODULES BY COURSE ================= */
exports.getModulesByCourse = (req, res) => {
  const { course_id } = req.params;

  db.query(
    "SELECT * FROM modules WHERE course_id = ?",
    [course_id],
    (err, results) => {
      if (err) return sendError(res, err.message, 500);

      return sendSuccess(res, results);
    }
  );
};

/* ================= GET LESSONS BY MODULE ================= */
exports.getLessonsByModule = (req, res) => {
  const { module_id } = req.params;

  db.query(
    "SELECT * FROM lessons WHERE module_id = ?",
    [module_id],
    (err, results) => {
      if (err) return sendError(res, err.message, 500);

      return sendSuccess(res, results);
    }
  );
};

/* ================= GET SINGLE LESSON ================= */
exports.getLessonById = (req, res) => {
  const { lesson_id } = req.params;

  db.query(
    "SELECT * FROM lessons WHERE id = ?",
    [lesson_id],
    (err, results) => {
      if (err) return sendError(res, err.message, 500);

      if (results.length === 0) {
        return sendError(res, "Lesson not found", 404);
      }

      return sendSuccess(res, results[0]);
    }
  );
};