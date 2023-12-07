const express = require("express");
const connectionDB = require("./config/db");
const AppError = require("./utils/appError");
const globalErrorHandler = require("../backend/controller/error-controller");
const CategorieRouter = require("./routes/categorie-routes");
const ProfesseurRouter = require("./routes/professeur-routes");
const MatiereRouter = require("./routes/matiere-routes");
const CoursRouter = require("./routes/cours-routes");
const UserRouter = require("../backend/auth/routes/user-routes");
const FilliereRouter = require("./routes/filliere-router");
const SemestreRouter = require("./routes/semestre-router");
const groupRouter = require("./routes/group-router");
const emploiRouter = require("./routes/emploi-router");
const paiementRouter = require("./routes/paiement-router");
const AuthRouter = require("../backend/auth/routes/auth-routes");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
process.on("uncaughtException", (err) => {
  console.log("UNCAUGhtT EXCEPTION! shutting down ...");
  console.log(err.name, err.message);

  process.exit(1);
});
const dotenv = require("dotenv").config();
const port = process.env.PORT || 5000;
//connection db
connectionDB();

const app = express();
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
app.use(express.json({ limit: "10kb" }));
//Data sanitization against  NotSQL query injection
app.use(mongoSanitize());
// Dta sanitization against xss
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["type", "date", "debit", "fin", "categorie"],
  })
);
// Set security HTTP headers
app.use(helmet());

//Limit requests from same IPI

const limiter = rateLimit({
  max: 10,
  windowMs: 60 * 60 * 1000,
  error: {
    status: "fail",
    message: "To many request from IP , Please try again in an hour!",
  },
});
app.use("/auth", limiter);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(`hello from midelwere at ${req.requestTime}`);
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);

  next();
});

app.use("/user", UserRouter);
app.use("/auth", AuthRouter);
app.use("/professeur", ProfesseurRouter);
app.use("/categorie", CategorieRouter);
app.use("/matiere", MatiereRouter);
app.use("/cours", CoursRouter);
app.use("/filliere", FilliereRouter);
app.use("/semestre", SemestreRouter);
app.use("/group", groupRouter);
app.use("/emploi", emploiRouter);
app.use("/paiement", paiementRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`cant not found ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);
// app.use(notFound);
// app.request(errorHandler);

const server = app.listen(port, () =>
  console.log("serveur a demare a PORT " + port)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED EXCEPTION! shutting down 1...");
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
