const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const indexRouter = require("./routes/index");
app.use("/", indexRouter);
const usersRouter = require("./routes/users");
app.use("/users", usersRouter);
const catalogRouter = require("./routes/catalog");
app.use("/catalog", catalogRouter);

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

const createError = require("http-errors");
app.use(function (req, res, next) {
  next(createError(404));
});

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const logger = require("morgan");
app.use(logger("dev"));

const compression = require("compression");
app.use(compression());

const helmet = require("helmet");
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'"],
    },
  })
);

const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
});
app.use(limiter);

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = mongodb+srv://docodoco0713:0Y8nczZBMCaiUe40@cluster0.iki2ezu.mongodb.net/local_library?retryWrites=true&w=majority;
async function main() {
  await mongoose.connect(mongoDB);
}
main().catch((err) => console.log(err));

module.exports = app;
