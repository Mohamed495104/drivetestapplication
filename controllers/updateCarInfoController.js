const User = require("../models/user");

module.exports = async (req, res) => {
  const { carMake, carModel, carYear, plateNumber } = req.body;

  try {
    // Update the logged-in user's car information
    await User.findByIdAndUpdate(req.session.userId, {
      car_details: {
        make: carMake,
        model: carModel,
        year: carYear,
        platno: plateNumber,
      },
    });

    res.redirect("/G_Page");
  } catch (error) {
    console.error("Error updating car info:", error);
    res.render("G_Page", {
      error: "Error updating car information. Please try again.",
    });
  }
};