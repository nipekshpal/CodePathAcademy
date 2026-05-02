const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.getQuestions = (req, res) => {
  const sql = "SELECT * FROM questions";

  db.query(sql, (err, result) => {
    if (err) return sendError(res, "Failed to fetch questions", 500);

    return sendSuccess(res, result);
  });
};

exports.getQuestionById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM questions WHERE id=?";

  db.query(sql, [id], (err, result) => {
    if (err) return sendError(res, "Failed to fetch question", 500);
    if (!result.length) return sendError(res, "Question not found", 404);

    return sendSuccess(res, result[0]);
  });
};