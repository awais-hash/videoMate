import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  try {
    console.error("ErrorHandler received:", err);

    let error = err || {};

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(e => e.message);
      error = new ApiError(400, "Validation Error", errors);
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      error = new ApiError(409, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`);
    }

    if (error.name === "CastError") {
      error = new ApiError(400, "Invalid ID format");
    }

    if (error.type === "entity.parse.failed") {
      error = new ApiError(400, "Invalid JSON in request body");
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      error = new ApiError(413, "File too large");
    }

    const statusCode = (error && error.statusCode) || 500;
    const message = (error && error.message) || "Internal Server Error";

    const response = {
      success: false,
      message,
      statusCode,
      errors: (error && error.errors) || [],
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = (error && error.stack) || (err && err.stack);
    }

    return res.status(statusCode).json(response);
  } catch (handlerErr) {
    console.error("Error inside errorHandler:", handlerErr);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      statusCode: 500,
      errors: [],
    });
  }
};

export default errorHandler;
