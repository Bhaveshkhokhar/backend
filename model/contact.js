const mongoose = require('mongoose');
const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
    enum: [
      'Delhi',
      'Mumbai',
      'Bangalore',
      'Hyderabad',
      'Chennai',
      'Kolkata',
      'Lucknow',
      'Pune',
    ],
  },
  mobile: {
    type: String,
    required: true,
    maxlength: 10,
    minlength: 10,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  }
});
exports.Contact = mongoose.model('Contact', ContactSchema);