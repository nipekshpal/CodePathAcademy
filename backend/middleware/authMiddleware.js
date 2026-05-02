const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");

function authenticateToken(req, res, next) {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, "Token required", 401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

    if (err) {
      return sendError(res, "Invalid token", 403);
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;