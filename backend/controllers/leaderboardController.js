const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.getLeaderboard = (req, res) => {
  const sql = `
  SELECT id, name, points, questions_solved
  FROM users
  ORDER BY points DESC
  LIMIT 10
  `;

  db.query(sql, (err, result) => {
    if (err) return sendError(res, "Failed to load leaderboard", 500);

    return sendSuccess(res, result);
  });
};