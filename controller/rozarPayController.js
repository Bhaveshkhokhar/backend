const Razorpay = require("razorpay");
const Booking = require("../model/booking");
const User = require("../model/user");
const Chef = require("../model/chef");
const Order = require("../model/order");
const jwt = require("jsonwebtoken");
const Mongoose = require("mongoose");
const crypto = require("crypto");
const gstRate = 0.18;
require("dotenv").config();
const secret = process.env.SECRET_KEY;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res, next) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (req.body.date === todayStr && req.body.time < today.getHours() + 3) {
   return  res.status(422).json({
      status: "not a valid time",
    });
  }
  const token = req.cookies.user_token;
  if (!token) {
    return res.status(401).json({
      isLoggedIn: false,
      message: "please login",
    });
  }
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      // token is valid
    } catch (err) {
      // token is invalid or expired
      return res.status(401).json({
        isLoggedIn: false,
        message: "user is not authenticated please login",
      });
    }

    const existingUser = await User.findOne({ mobile: decoded.Number });

    if (!existingUser) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "User not found please sign in",
      });
    }
    if (existingUser.status === false) {
      return res.status(403).json({
        message:
          "Your Account is Blocked from Host side for further info please contact us",
      });
    }
    const existingchef = await Chef.findOne({
      _id: new Mongoose.Types.ObjectId(req.body.chefid),
    });

    if (!existingchef) {
      return res.status(404).json({
        message: "chef is not found",
        status: "fail",
      });
    }
    if (!existingchef.available) {
      return res.status(409).json({
        message: `${existingchef.name} is not available`,
        status: "fail",
      });
    }
    const existingbooking = await Booking.findOne({
      chef_id: new Mongoose.Types.ObjectId(req.body.chefid),
      date: req.body.date,
      time: req.body.time,
    });
    if (existingbooking) {
      return res.status(422).json({
        message: "chef is already booked at that time",
        status: "fail",
      });
    }
    const basePrice = existingchef.price;
    const totalPrice = basePrice + basePrice * gstRate;
    const booking = new Booking({
      chef_id: req.body.chefid,
      user_id: req.body.userid,
      totalPrice,
      date: req.body.date,
      time: req.body.time,
      Address: req.body.address,
      modeOfPayment: req.body.modeOfPayment,
      bookedAt: new Date(),
      paid: false,
    });
    const confirmbooking = await booking.save();
    
      const options = {
        amount: totalPrice * 100, // in paise (₹1 = 100 paise)
        currency: "INR",
        receipt: booking._id.toString(), // Use the booking ID as the receipt
      };
      const order = await razorpay.orders.create(options);
      const newOrder = new Order({
        booking_id: confirmbooking._id,
        razorpay_order_id: order.id,
        amount: totalPrice,
        currency: "INR",  
      });
      await newOrder.save();
      const populatedConfirmBooking = await Booking.findById(
        confirmbooking._id,
      ).populate("chef_id", "name profileImage _id type");
      return res.status(201).json({order:order,
        confirmbooking: populatedConfirmBooking
      });
    
  } catch (error) {
    console.error("Error while create order on rozar pay:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.verifyPayment = async (req, res, next) => {
  const token = req.cookies.user_token;
  if (!token) {
    return res.status(401).json({
      isLoggedIn: false,
      message: "please login",
    });
  }
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      // token is valid
    } catch (err) {
      // token is invalid or expired
      return res.status(401).json({
        isLoggedIn: false,
        message: "user is not authenticated please login",
      });
    }

    const existingUser = await User.findOne({ mobile: decoded.Number });

    if (!existingUser) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "User not found please sign in",
      });
    }
    if (existingUser.status === false) {
      return res.status(403).json({
        message:
          "Your Account is Blocked from Host side for further info please contact us",
      });
    }
    const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

    const order = await Order.findOne({ razorpay_order_id });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
  if (expectedSignature === razorpay_signature) {
     
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.status = "paid";

    await order.save();
    
    const confirmbooking = await Booking.findByIdAndUpdate(
      order.booking_id,
      { paid: true },
    );

      return res.status(201).json({
        confirmbooking_id: confirmbooking._id,
        status: "success",
      });
  } else {
    await Order.findOneAndUpdate(
    { razorpay_order_id },
    { status: "failed" }
  );
    return res.status(400).json({ success: false });
  }

  } catch (error) {
    console.error("Error while verify payment on rozar pay:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.retryPayment = async (req, res, next) => {
   
  const token = req.cookies.user_token;
  if (!token) {
    return res.status(401).json({
      isLoggedIn: false,
      message: "please login",
    });
  }
  try {
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      // token is valid
    } catch (err) {
      // token is invalid or expired
      return res.status(401).json({
        isLoggedIn: false,
        message: "user is not authenticated please login",
      });
    }

    const existingUser = await User.findOne({ mobile: decoded.Number });

    if (!existingUser) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "User not found please sign in",
      });
    }
    if (existingUser.status === false) {
      return res.status(403).json({
        message:
          "Your Account is Blocked from Host side for further info please contact us",
      });
    }
    const existingbooking = await Booking.findOne({
      _id: new Mongoose.Types.ObjectId(req.body.booking_id),
    });

    if (!existingbooking) {
      return res.status(404).json({
        message: "booking is not found",
        status: "fail",
      });
    }
    if (existingbooking.paid) {
      return res.status(422).json({
        message: "booking is already paid",
        status: "fail",
      });
    }
    if(existingbooking.modeOfPayment!=="COD"){
       await Order.findOneAndDelete({ booking_id: existingbooking._id });
       
    }else{
      existingbooking.modeOfPayment="ONLINE";
       await existingbooking.save();
    }
   
      const options = {
        amount: existingbooking.totalPrice * 100, // in paise (₹1 = 100 paise)
        currency: "INR",
        receipt: existingbooking._id.toString(), // Use the booking ID as the receipt
      };
      const order = await razorpay.orders.create(options);
      const newOrder = new Order({
        booking_id: existingbooking._id,
        razorpay_order_id: order.id,
        amount: existingbooking.totalPrice,
        currency: "INR",  
      });
      await newOrder.save();
      return res.status(201).json({order:order,booking_id:existingbooking._id});
    
  } catch (error) {
    console.error("Error while create order on rozar pay:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
}
