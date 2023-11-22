const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handlerDuplicateFeildsDB = (err) => {
  // const value = err.message.match(/([^"]*)/);
  const field = JSON.stringify(err.keyPattern);
  const value = field.match(/(["'])(\\?.)*?\1/)[0];
  const value1 = (err.keyValue + "." + field).toString;
  // console.log(value);
  const message = `Duplicate field value: ${value} Please use another value!`;
  return new AppError(message, 400);
};
const handlerValidatorErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Ivalid input data.${errors.join(". ")}`;
  return new AppError(message, 400);
};
const handlerJWTError = (err) => {
  return new AppError("Invalid token ,Please login again !", 401);
};
const handlerJWTExpiredError = (err) => {
  return new AppError("Your token has expired! ,Please login again !", 401);
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrorProd = (err, res) => {
  // Operational trusted error send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // Programing or unknown error don`t teak error details
  } else {
    // 1) log error
    console.log("ERROR", err);
    // 2) send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // "production" "development"
  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handlerDuplicateFeildsDB(error);
    if (err.name === "ValidationError") {
      error = handlerValidatorErrorDB(error);
    }
    if (err.name === "JsonWebTokenError") error = handlerJWTError(error);

    if (err.name === "TokenExpiredError") error = handlerJWTExpiredError(error);

    sendErrorProd(error, res);
  }
};
