const mongoose = require("mongoose");

const G2ApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  licenseNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{8}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid license number!`,
    },
  },
  age: {
    type: Number,
    required: true,
    min: [16, "Age must be at least 16"],
  },
  dateOfBirth: { type: Date, required: true },
  carMake: { type: String, required: true },
  carModel: { type: String, required: true },
  carYear: {
    type: Number,
    required: true,
    min: [1900, "Invalid car year"],
    max: [new Date().getFullYear() + 1, "Car year cannot be in the future"],
  },
  plateNumber: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const G2Application = mongoose.model("G2Application", G2ApplicationSchema);

module.exports = G2Application;