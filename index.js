// ==================== PACKAGE IMPORTS ====================
const express = require("express");
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const expressSession = require("express-session");
const flash = require("express-flash");
const session = require("express-session");

// Initialize Express application
const app = new express();

// ==================== MODEL IMPORTS ====================
const User = require("./models/user");
const G2Application = require("./models/G2Application");
const Appointment = require("./models/appointment");

// ==================== CONTROLLER IMPORTS ====================
// Authentication and core controllers
const homeController = require("./controllers/homeController");
const loginController = require("./controllers/loginController");
const loginUserController = require("./controllers/loginUserController");
const signupController = require("./controllers/signupController");
const storeUserController = require("./controllers/storeUserController");
const logoutController = require("./controllers/logoutController");

// Driver-specific controllers
const g2PageController = require("./controllers/g2PageController");
const storeG2ApplicationController = require("./controllers/storeG2ApplicationController");
const gPageController = require("./controllers/gPageController");
const fetchUserController = require("./controllers/fetchUserController");
const updateCarInfoController = require("./controllers/updateCarInfoController");

// Admin and examiner controllers
const appointmentController = require("./controllers/appointmentController");
const examinerController = require("./controllers/examinerController");

// ==================== MIDDLEWARE IMPORTS ====================
const {
  authMiddleware,
  adminMiddleware,
  driverMiddleware,
  examinerMiddleware,
} = require("./middlewares/authMiddleware");
const redirectIfAuthenticatedMiddleware = require("./middlewares/redirectIfAuthenticatedMiddleware");

// ==================== MONGODB CONNECTION ====================
mongoose
  .connect("mongodb+srv://admin:admin@cluster0.r2q3j.mongodb.net/")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// ==================== APP CONFIGURATION ====================
// Set view engine to EJS for rendering templates
app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Parse URL-encoded and JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure session middleware
app.use(
  session({
    secret: "driving-test-app-secret", // Used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
  })
);

// Configure flash messages
app.use(flash());

// ==================== GLOBAL VARIABLES FOR VIEWS ====================
/**
 * Makes variables available to all EJS templates
 * Sets up user authentication and role information
 */
app.use((req, res, next) => {
  // Make user authentication status available to views
  res.locals.loggedIn = req.session.userId;

  // Make user role/type available to views
  res.locals.userType = req.session.userType;

  // Create helper flags for menu visibility based on user role
  res.locals.showDriverMenu =
    req.session.userId && req.session.userType === "Driver";
  res.locals.showExaminerMenu =
    req.session.userId && req.session.userType === "Examiner";
  res.locals.showAdminMenu =
    req.session.userId && req.session.userType === "Admin";

  next();
});

// --------- Public Routes ---------
// Home Route - accessible to all users
app.get("/", homeController);

// Authentication Routes
app.get("/signup", redirectIfAuthenticatedMiddleware, signupController);
app.post("/signup", storeUserController);
app.get("/login", redirectIfAuthenticatedMiddleware, loginController);
app.post("/login", loginUserController);
app.get("/logout", logoutController);

// --------- Driver Routes ---------
// G2 License application routes
app.get("/G2_Page", authMiddleware, driverMiddleware, g2PageController);
app.post(
  "/G2_Page",
  authMiddleware,
  driverMiddleware,
  storeG2ApplicationController
);

// G License application routes
app.get("/G_Page", authMiddleware, driverMiddleware, gPageController.getGPage);
app.post("/G_Page", authMiddleware, driverMiddleware, updateCarInfoController);
app.post(
  "/g/book-slot",
  authMiddleware,
  driverMiddleware,
  gPageController.bookGSlot
);

// Driver-specific appointment routes
app.get(
  "/my-appointments",
  authMiddleware,
  driverMiddleware,
  appointmentController.getMyAppointments
);

// --------- Examiner Routes ---------
app.get(
  "/examiner",
  authMiddleware,
  examinerMiddleware,
  examinerController.dashboard
);
app.get(
  "/examiner/filter/:testType",
  authMiddleware,
  examinerMiddleware,
  examinerController.filterByTestType
);
app.get(
  "/examiner/driver/:id",
  authMiddleware,
  examinerMiddleware,
  examinerController.viewDriver
);
app.post(
  "/examiner/submit-result",
  authMiddleware,
  examinerMiddleware,
  examinerController.submitTestResult
);

// --------- Admin Routes ---------
app.get("/appointment", adminMiddleware, appointmentController.getAppointments);
app.post(
  "/appointment/create",
  adminMiddleware,
  appointmentController.createAppointment
);
app.delete(
  "/appointment/delete/:id",
  adminMiddleware,
  appointmentController.deleteAppointment
);
app.get(
  "/testResults",
  authMiddleware,
  adminMiddleware,
  appointmentController.getTestResults
);

// --------- API Routes ---------
// Fetch user data
app.post("/fetchUser", authMiddleware, fetchUserController);

// Appointment API routes
app.get("/api/appointments", adminMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    const appointments = await Appointment.find({
      date: new Date(date),
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Slot availability API routes
app.get(
  "/api/g2-slots",
  authMiddleware,
  driverMiddleware,
  appointmentController.getAvailableG2Slots
);
app.get(
  "/api/g-slots",
  authMiddleware,
  driverMiddleware,
  appointmentController.getAvailableGSlots
);

// Booking routes
app.post(
  "/appointment/book-g2",
  authMiddleware,
  driverMiddleware,
  appointmentController.bookG2Appointment
);
app.post(
  "/appointment/book-g",
  authMiddleware,
  driverMiddleware,
  appointmentController.bookGAppointment
);

// Cancel appointment route
app.post(
  "/appointment/cancel",
  authMiddleware,
  driverMiddleware,
  appointmentController.cancelAppointment
);

// ==================== SERVER INITIALIZATION ====================
// Start the server on port 4000
app.listen(4000, () => {
  console.log("The app is running on port 4000");
});
