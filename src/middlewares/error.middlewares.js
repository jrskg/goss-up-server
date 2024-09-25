export const error = (err, req, res, next) => {
  err.message = err.message || "Internal server error";
  err.statusCode = err.statusCode || 500;

  if (err.name === "CastError" && err.kind === "ObjectId") {
    err.statusCode = 400;
    err.message = `Invalid object id given`;
  }

  if (err.name === "ValidationError") {
    err.statusCode = 400;
    err.message = err.message;
  }

  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
  });
};
