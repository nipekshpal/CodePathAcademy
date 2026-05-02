const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.saveActivity = (req, res) => {
  const userId = req.user.id;

  const {
    time_spent = 0,
    questions_solved = 0,
    correct_answers = 0,
    wrong_answers = 0
  } = req.body;

  const today = new Date().toISOString().split("T")[0];

  const sql = `
  INSERT INTO user_activity
  (user_id,activity_date,time_spent,questions_solved,correct_answers,wrong_answers)
  VALUES (?,?,?,?,?,?)
  ON DUPLICATE KEY UPDATE
  time_spent=time_spent+VALUES(time_spent),
  questions_solved=questions_solved+VALUES(questions_solved),
  correct_answers=correct_answers+VALUES(correct_answers),
  wrong_answers=wrong_answers+VALUES(wrong_answers)
  `;

  db.query(
    sql,
    [
      userId,
      today,
      time_spent,
      questions_solved,
      correct_answers,
      wrong_answers
    ],
    (err) => {
      if (err) return sendError(res, "Failed to save activity", 500);

      return sendSuccess(res, { message: "Activity saved" });
    }
  );
};

exports.userStats = (req, res) => {
  const sql = `
  SELECT
  SUM(time_spent) as total_time,
  SUM(questions_solved) as total_questions,
  SUM(correct_answers) as total_correct,
  SUM(wrong_answers) as total_wrong
  FROM user_activity
  WHERE user_id=?
  `;

  db.query(sql, [req.user.id], (err, stats) => {
    if (err) return sendError(res, "Failed to load activity stats", 500);

    return sendSuccess(res, {
      total_time: stats[0]?.total_time || 0,
      total_questions: stats[0]?.total_questions || 0,
      total_correct: stats[0]?.total_correct || 0,
      total_wrong: stats[0]?.total_wrong || 0
    });
  });
};