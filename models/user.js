const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['Driver', 'Examiner', 'Admin'], required: true },
  firstname: { type: String, default: 'default' },
  lastname: { type: String, default: 'default' },
  age: { type: String, default: 'default' },
  LicenseNo: { type: String, default: 'default' },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  car_details: {
    make: { type: String, default: 'default' },
    model: { type: String, default: 'default' },
    year: { type: String, default: '0' },
    platno: { type: String, default: 'default' }
  },
  testType: { 
    type: String, 
    enum: ['G2', 'G'], 
    default: null 
  },
  testResult: {
    passed: { type: Boolean, default: null },
    comments: { type: String, default: '' },
    examiner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    date: { type: Date }
  }
});

userSchema.pre('save', function(next) {
  const user = this;
  if (user.isModified('password')) {
    bcrypt.hash(user.password, 10, (error, hash) => {
      if (error) return next(error);
      user.password = hash;
      next();
    });
  } else {
    next();
  }
});

module.exports = mongoose.model('User', userSchema);