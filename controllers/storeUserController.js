const User = require('../models/user');
const bcrypt = require('bcrypt');

module.exports = async (req, res) => {
  try {
    const { username, password, confirmPassword, userType } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render('Signup', {
        error: 'Passwords do not match',
        formData: req.body
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('Signup', {
        error: 'Username already exists',
        formData: req.body
      });
    }

    // Create a new user with hashed password 
    const newUser = new User({
      username: username,
      password: password,  
      userType: userType,
      firstname: "default",
      lastname: "default",
      age: "default",
      LicenseNo: `default-${Date.now()}`,
      car_details: {
        make: "default",
        model: "default",
        year: "0",
        platno: "default"
      }
    });

    await newUser.save();
    res.render('Login', { success: 'Registration successful! Please log in.' });

  } catch (error) {
    console.error('Signup Error:', error);
    res.render('Signup', { error: 'Error during signup. Please try again.' });
  }
};
