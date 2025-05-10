const User = require("../models/user");

module.exports = async (req, res) => {
  const { firstName, lastName, licenseNumber, age, carMake, carModel, carYear, plateNumber } = req.body;

  try {
    // Update the logged-in user's data
    await User.findByIdAndUpdate(req.session.userId, {
      firstname: firstName,
      lastname: lastName,
      LicenseNo: licenseNumber,
      age: age,
      car_details: {
        make: carMake,
        model: carModel,
        year: carYear,
        platno: plateNumber,
      },
    });

    res.redirect("/G2_Page");
  } catch (error) {
    console.error("Error updating user data:", error);
    res.render("G2_Page", {
      error: "Error updating user data. Please try again.",
    });
  }
};