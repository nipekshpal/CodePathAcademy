const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.addModule = (req, res) => {
  const { course_id, title } = req.body;
  if (!course_id || !title) {
    return sendError(res, "course_id and title are required", 400);
  }

  db.query(
    "INSERT INTO modules (course_id, title) VALUES (?,?)",
    [course_id, title],
    (err, result) => {
      if (err) return sendError(res, "Failed to add module", 500);

      return sendSuccess(res, { id: result.insertId, message: "Module added" }, 201);
    }
  );
};


exports.addLesson = (req, res) => {
  const { module_id, title, content, video_url } = req.body;
  if (!module_id || !title || !content) {
    return sendError(res, "module_id, title and content are required", 400);
  }

  db.query(
    "INSERT INTO lessons (module_id, title, content, video_url) VALUES (?,?,?,?)",
    [module_id, title, content, video_url],
    (err, result) => {
      if (err) return sendError(res, "Failed to add lesson", 500);

      return sendSuccess(res, { id: result.insertId, message: "Lesson added" }, 201);
    }
  );
};