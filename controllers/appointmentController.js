// Import required models
const Appointment = require("../models/appointment");
const User = require("../models/user");

// ADMIN FUNCTIONS

// Display all appointments for admin management
exports.getAppointments = async (req, res) => {
  try {
    // Get all appointments sorted by date and time
    const appointments = await Appointment.find({}).sort({ date: 1, time: 1 });

    res.render("appointment", {
      title: "Manage Appointments",
      appointments: appointments,
      user: req.session.user,
      userType: req.session.userType,
      loggedIn: true,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).render("error", {
      message: "Error loading appointments",
      error: error,
    });
  }
};

// View test results with optional filtering
exports.getTestResults = async (req, res) => {
  try {
    const filter = req.query.filter;

    // Create base query for drivers with test results
    let query = {
      userType: "Driver",
      "testResult.passed": { $exists: true },
    };

    // Apply filter if provided
    if (filter === "passed") {
      query["testResult.passed"] = true;
    } else if (filter === "failed") {
      query["testResult.passed"] = false;
    }

    const drivers = await User.find(query)
      .sort({ "testResult.date": -1 })
      .populate({
        path: "testResult.examiner",
        select: "firstname lastname",
      });

    res.render("testResults", {
      title: "Driver Test Results",
      drivers: drivers,
      currentFilter: filter,
      userType: req.session.userType,
      loggedIn: true,
    });
  } catch (error) {
    console.error("Error fetching test results:", error);
    res.status(500).render("error", {
      message: "Error loading test results",
      error: error,
    });
  }
};

// Create a new appointment slot
exports.createAppointment = async (req, res) => {
  try {
    const { date, time, testType } = req.body;

    // Check required fields
    if (!date || !time || !testType) {
      return res.status(400).json({
        success: false,
        message: "Date, time and test type are required",
      });
    }

    // Check valid test type
    if (!["G2", "G"].includes(testType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test type. Must be either G2 or G",
      });
    }

    // Fix date handling with UTC
    const appointmentDate = new Date(date);
    const year = appointmentDate.getFullYear();
    const month = appointmentDate.getMonth();
    const day = appointmentDate.getDate();

    const utcDate = new Date(Date.UTC(year, month, day));
    console.log(`Created date for appointment: ${utcDate.toISOString()}`);

    // Check for existing appointments on same day/time/type
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    console.log(
      `Checking for existing appointments between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`
    );

    const existingAppointment = await Appointment.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      time: time,
      testType: testType,
    });

    // Don't allow duplicate appointments
    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message:
          "This time slot already exists for the selected date and test type",
      });
    }

    // Create new appointment
    const newAppointment = new Appointment({
      date: utcDate,
      time: time,
      testType: testType,
      isBooked: false,
    });

    await newAppointment.save();
    console.log(
      `New appointment created with date: ${newAppointment.date.toISOString()}`
    );

    res.status(201).json({
      success: true,
      message: "Appointment slot created successfully",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating appointment slot",
      error: error.message,
    });
  }
};

// Delete an appointment slot
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    // Check if appointment exists
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // If booked, remove from user's appointments list
    if (appointment.driver) {
      await User.findByIdAndUpdate(appointment.driver, {
        $pull: { appointments: appointment._id },
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting appointment",
      error: error.message,
    });
  }
};

// DRIVER FUNCTIONS

// Get a driver's booked appointments
exports.getMyAppointments = async (req, res) => {
  try {
    // Find all appointments for the current user
    const appointments = await Appointment.find({
      driver: req.session.userId,
    }).sort({ date: 1, time: 1 });

    console.log(
      `Found ${appointments.length} appointments for user ${req.session.userId}`
    );

    res.render("my-appointments", {
      title: "My Appointments",
      appointments: appointments,
      user: req.session.user,
      userType: req.session.userType,
      loggedIn: true,
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    res.status(500).render("error", {
      message: "Error loading your appointments",
      error: error,
    });
  }
};

// Cancel a booked appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.session.userId;

    console.log(
      `Cancel attempt - Appointment ID: ${appointmentId}, User ID: ${userId}`
    );

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Verify user owns this appointment
    if (appointment.driver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments",
      });
    }

    // Check if appointment is in the past
    const now = new Date();
    const appointmentDateTime = new Date(appointment.date);
    const [hours, minutes] = appointment.time.split(":").map(Number);
    appointmentDateTime.setUTCHours(hours, minutes, 0, 0);

    if (appointmentDateTime < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel past appointments",
      });
    }

    // Mark appointment as available again
    appointment.isBooked = false;
    appointment.driver = undefined;
    await appointment.save();

    // Remove from user's appointments
    await User.findByIdAndUpdate(userId, {
      $pull: { appointments: appointmentId },
    });

    console.log("Appointment cancelled successfully");

    res.json({
      success: true,
      message: "Your appointment has been cancelled successfully",
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment: " + error.message,
    });
  }
};

// Book a G2 test appointment
exports.bookG2Appointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.session.userId;

    console.log(
      `Booking attempt - Appointment ID: ${appointmentId}, User ID: ${userId}`
    );

    // Get appointment and check availability
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      console.log("Appointment not found");
      return res.status(400).json({
        success: false,
        message: "Appointment slot not found",
      });
    }

    if (appointment.isBooked) {
      console.log("Appointment already booked");
      return res.status(400).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    if (appointment.testType !== "G2") {
      console.log("Incorrect test type");
      return res.status(400).json({
        success: false,
        message: "This slot is not for G2 test",
      });
    }

    // Mark appointment as booked
    appointment.isBooked = true;
    appointment.driver = userId;
    await appointment.save();

    console.log("Appointment updated successfully");

    // Update user record
    await User.findByIdAndUpdate(userId, {
      $push: { appointments: appointmentId },
      testType: "G2",
    });

    console.log("User updated successfully");

    res.json({
      success: true,
      message: "G2 test booking successful",
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing G2 booking: " + error.message,
    });
  }
};

// Book a G test appointment
exports.bookGAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.session.userId;

    // Get appointment and check availability
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(400).json({
        success: false,
        message: "Appointment slot not found",
      });
    }

    if (appointment.isBooked) {
      return res.status(400).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    if (appointment.testType !== "G") {
      return res.status(400).json({
        success: false,
        message: "This slot is not for G test",
      });
    }

    // Mark appointment as booked
    appointment.isBooked = true;
    appointment.driver = userId;
    await appointment.save();

    // Update user record
    await User.findByIdAndUpdate(userId, {
      $push: { appointments: appointmentId },
      testType: "G",
    });

    res.json({
      success: true,
      message: "G test booking successful",
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing G booking: " + error.message,
    });
  }
};

// UTILITY FUNCTIONS

// Get available G2 test slots for a date
exports.getAvailableG2Slots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    // Create date range for the selected day
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    console.log(
      `Fetching G2 slots between ${startDate.toISOString()} and ${endDate.toISOString()}`
    );

    // Find available slots
    const slots = await Appointment.find({
      date: { $gte: startDate, $lte: endDate },
      isBooked: false,
      testType: "G2",
    }).sort({ time: 1 });

    console.log(`Found ${slots.length} available G2 slots`);

    res.json(slots);
  } catch (error) {
    console.error("Error fetching G2 slots:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};

// Get available G test slots for a date
exports.getAvailableGSlots = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    // Create date range for the selected day
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    console.log(
      `Fetching G slots between ${startDate.toISOString()} and ${endDate.toISOString()}`
    );

    // Find available slots
    const slots = await Appointment.find({
      date: { $gte: startDate, $lte: endDate },
      isBooked: false,
      testType: "G",
    }).sort({ time: 1 });

    res.json(slots);
  } catch (error) {
    console.error("Error fetching G slots:", error);
    res.status(500).json({ error: "Server error: " + error.message });
  }
};
