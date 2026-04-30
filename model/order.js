const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    razorpay_order_id: {
      type: String,
      required: true,
      unique: true,
    },

    razorpay_payment_id: {
      type: String,
    },

    razorpay_signature: {
      type: String,
    },

    amount: {
      type: Number, // in rupees 
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },

    payment_method: {
      type: String, // card, upi, netbanking (optional)
    },

    failure_reason: {
      type: String,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

module.exports = mongoose.model("Order", OrderSchema);