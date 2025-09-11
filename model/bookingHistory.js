const mongoose = require("mongoose");
const BookinghistorySchema = new mongoose.Schema({
  chef_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chef",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type:String,
    required: true,
  },
  time: {
    type: Number, //e.g., 6
    required: true,
  },
  totalPrice: Number,
  status: {
    type: String,
    enum:["Completed","cancelled"],
    default:"Completed"
  },
  Address: {
    type: String,
    required: true,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  modeOfPayment:{
    type:String,
    required:true,
  }
});
module.exports = mongoose.model("BookingHistory", BookinghistorySchema);
