const { sendError } = require("../utils/apiResponse");

function notFoundHandler(req, res) {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === "development" ? err.stack : null
  );
}

module.exports = {
  notFoundHandler,
  errorHandler
};
