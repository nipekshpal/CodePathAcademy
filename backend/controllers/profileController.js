const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.getProfile = (req, res) => {
  const sql = `
  SELECT id,name,email,bio,college,profile_picture,joined_date
  FROM users
  WHERE id = ?
  `;

  db.query(sql, [req.user.id], (err, result) => {
    if (err) return sendError(res, "Failed to fetch profile", 500);
    if (!result.length) return sendError(res, "User not found", 404);

    return sendSuccess(res, result[0]);
  });
};

exports.updateProfile = (req, res) => {
  const { bio = "", college = "", profile_picture = "" } = req.body;

  const sql = `
  UPDATE users
  SET bio=?,college=?,profile_picture=?
  WHERE id=?
  `;

  db.query(sql, [bio, college, profile_picture, req.user.id], (err) => {
    if (err) return sendError(res, "Failed to update profile", 500);

    return sendSuccess(res, { message: "Profile updated successfully" });
  });
};