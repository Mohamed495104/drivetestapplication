const User = require("../models/user");
const Appointment = require("../models/appointment");

module.exports = {
  getGPage: async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.redirect("/login");
      }

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.redirect("/login");
      }

      // Check if user data is default
      const isDefaultData =
        user.firstname === "default" &&
        user.lastname === "default" &&
        user.age === "default" &&
        user.LicenseNo.startsWith("default-");

      if (isDefaultData) {
        return res.redirect("/G2_Page");
      }

      // Get available G test slots
      const availableSlots = await Appointment.find({
        testType: 'G',
        isBooked: false
      });

      const modifiedUser = {
        ...user._doc,
        firstname: user.firstname === "default" ? "" : user.firstname,
        lastname: user.lastname === "default" ? "" : user.lastname,
        age: user.age === "default" ? "" : user.age,
        LicenseNo: user.LicenseNo.startsWith("default-") ? "Not Available" : user.LicenseNo,
      };

      res.render("G_Page", { 
        user: modifiedUser, 
        userType: req.session.userType,
        slots: availableSlots 
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  bookGSlot: async (req, res) => {
    try {
      const { slotId } = req.body;
      
      // Update appointment
      const appointment = await Appointment.findByIdAndUpdate(slotId, {
        isBooked: true,
        driver: req.session.userId
      }, { new: true });
      
      // Update user with test type and appointment
      await User.findByIdAndUpdate(req.session.userId, {
        testType: 'G',
        $push: { appointments: slotId }
      });
      
      // Return JSON response instead of redirect
      res.json({ 
        success: true,
        message: 'G test appointment successfully booked!'
      });
    } catch (error) {
      console.error("Error booking slot:", error);
      res.status(500).json({ 
        success: false,
        message: 'Error booking appointment'
      });
    }
  }
};