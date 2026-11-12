
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const dbURL = process.env.ATLASDB_URL;

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// View engine configuration
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Trust Render's reverse proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// MongoDB session store
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

// Session configuration
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

// Session and authentication middleware
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages and current user
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews/", reviewRouter);
app.use("/", userRouter);

// 404 error handler
app.all("/{*splat}", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// General error handler
app.use((err, req, res, next) => {
  const {
    statusCode = 500,
    message = "Something went wrong!",
  } = err;

  res.status(statusCode).render("error.ejs", { message });
});

// Start server only after successful database connection
const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await mongoose.connect(dbURL);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();
