const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.completeLesson = (req, res) => {
  const userId = req.user.id;
  const { lesson_id } = req.body;
  if (!lesson_id) {
    return sendError(res, "lesson_id is required", 400);
  }

  const sql = `
  INSERT INTO course_progress (user_id, lesson_id, completed, completed_at)
  VALUES (?, ?, TRUE, NOW())
  `;

  db.query(sql, [userId, lesson_id], (err) => {
    if (err) return sendError(res, "Failed to complete lesson", 500);

    return sendSuccess(res, { message: "Lesson completed" });
  });
};

exports.getProgressStats = (req, res) => {
  const userId = req.user.id;

  const sql = `
  SELECT
    COUNT(cp.lesson_id) AS completed_lessons,
    COALESCE(u.points, 0) AS total_points,
    COALESCE(u.questions_solved, 0) AS questions_solved,
    COALESCE(u.correct_answers, 0) AS correct_answers
  FROM users u
  LEFT JOIN course_progress cp ON cp.user_id = u.id AND cp.completed = TRUE
  WHERE u.id = ?
  GROUP BY u.id, u.points, u.questions_solved, u.correct_answers
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return sendError(res, "Failed to fetch progress stats", 500);
    if (!result.length) return sendError(res, "User not found", 404);

    return sendSuccess(res, result[0]);
  });
};