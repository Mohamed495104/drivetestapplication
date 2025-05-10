const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  isBooked: { 
    type: Boolean, 
    default: false 
  },
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  testType: {
    type: String,
    enum: ['G2', 'G'],
    required: true
  }
}, { 
  timestamps: true,
  indexes: [
    { unique: true, fields: ['date', 'time'] }
  ]
});

module.exports = mongoose.model('Appointment', appointmentSchema);