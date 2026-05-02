const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  });
};

const sendError = (res, message, statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: details ? { message, details } : { message }
  });
};

module.exports = {
  sendSuccess,
  sendError
};
