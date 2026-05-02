const db = require("../config/db");
const { evaluateAnswer } = require("../services/aiService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.submitCode = async (req, res) => {
  const { question_id, code, language } = req.body;
  const userId = req.user.id;
  if (!question_id || !code || !language) {
    return sendError(res, "question_id, code and language are required", 400);
  }

  const sql = "SELECT description FROM questions WHERE id=?";

  db.query(sql, [question_id], async (err, result) => {
    if (err) return sendError(res, "Failed to fetch question", 500);
    if (!result.length) return sendError(res, "Question not found", 404);

    const question = result[0].description;

    const aiResult = await evaluateAnswer(question, code);

    const status = aiResult.correct ? "Accepted" : "Wrong";

    const insertQuery = `
    INSERT INTO submissions (user_id, question_id, code, language, status)
    VALUES (?,?,?,?,?)
    `;

    db.query(
      insertQuery,
      [userId, question_id, code, language, status],
      (err) => {
        if (err) return sendError(res, "Failed to save submission", 500);

        // update user progress
        if (status === "Accepted") {

          const updateProgress = `
          UPDATE users
          SET 
          questions_solved = questions_solved + 1,
          correct_answers = correct_answers + 1,
          points = points + 10
          WHERE id = ?
          `;

          db.query(updateProgress, [userId]);
        }

        return sendSuccess(res, {
          result: status,
          explanation: aiResult.explanation
        });
      }
    );
  });
};