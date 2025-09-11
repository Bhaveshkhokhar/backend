const Booking = require("../model/booking");
const BookingHistory = require("../model/bookingHistory");
const User = require("../model/user");
const Chef = require("../model/chef");
const Host = require("../model/host");
const jwt = require("jsonwebtoken");
const Mongoose = require("mongoose");
const gstRate = 0.18;
require("dotenv").config();
const secret = process.env.SECRET_KEY;

exports.chefBookingUpdate=async(req,res,next)=>{
  const token = req.cookies.chef_token;
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
        message: "Chef is not authenticated please login",
      });
    }
    const chef=await Chef.findOne({mobile:decoded.Number});
    const booking = await Booking.findByIdAndDelete({
      _id: req.body.id,
    });
    if (!booking) {
      const bookinghist =await BookingHistory.findOne({date:req.body.date,time:req.body.time,chef_id:chef._id, bookedAt:req.body.bookedAt});
      if(!bookinghist) {
         return res
        .status(404)
        .json({ message: "Booking not found", id: req.body.id, });
      }
      return res
        .status(400)
        .json({ message: `Booking already ${bookinghist.status}`, id: req.body.id, status:bookinghist.status });
    }
    const bookinghistory = new BookingHistory({
      chef_id: booking.chef_id,
      user_id: booking.user_id,
      totalPrice: booking.totalPrice,
      date: booking.date,
      time: booking.time,
      Address: booking.Address,
      modeOfPayment: booking.modeOfPayment,
      bookedAt: booking.bookedAt,
      status: req.body.action,
    });
    await bookinghistory.save();
    return res.status(201).json({
      status: "success",
    });
  } catch (error) {
    console.error("Error while cancel booking:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
}

exports.getChefBookings= async (req, res, next) => {
  const token = req.cookies.chef_token;
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
        message: "Chef is not authenticated please login",
      });
    }

    const existingChef = await Chef.findOne({ mobile: decoded.Number });

    if (!existingChef) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "Chef not found in Database",
      });
    }
    const bookings = await Booking.find({ chef_id: existingChef._id }).populate(
      "user_id",
      "name mobile"
    );
    const data=bookings.map((booking)=>{
      return {
        bookedAt:booking.bookedAt,
        id:booking._id,
        user:booking.user_id,
        date:booking.date,
        time:booking.time,
        price:booking.totalPrice,
        address:booking.Address,
        modeOfPayment:booking.modeOfPayment,
      }
    })

    return res.status(201).json({
      BookingData: data,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send user detail:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.hostCancelBooking=async(req,res,next)=>{
  const token = req.cookies.host_token;
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
        message: "host is not authenticated please login",
      });
    }

    const host = await Host.findOne({ hostid: decoded.Hostid });

    if (!host) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "Host not found",
      });
    }
   const booking = await Booking.findByIdAndDelete({
      _id: new Mongoose.Types.ObjectId(req.body.id),
    });
    if (!booking) {

      const bookinghist =await BookingHistory.findOne({date:req.body.date,time:req.body.time,chef_id:req.body.chefid,bookedAt:req.body.bookedAt});
      if(!bookinghist) {
         return res
        .status(404)
        .json({ message: "Booking not found", id: req.body.id, });
      }
      return res
        .status(400)
        .json({ message: `Booking already ${bookinghist.status}`, id: req.body.id, status:bookinghist.status });
    }
    const bookinghistory = new BookingHistory({
      chef_id: booking.chef_id,
      user_id: booking.user_id,
      totalPrice: booking.totalPrice,
      date: booking.date,
      time: booking.time,
      Address: booking.Address,
      modeOfPayment: booking.modeOfPayment,
      bookedAt: booking.bookedAt,
      status: "cancelled",
    });
    await bookinghistory.save();
    return res.status(201).json({
      status: "success",
    });
  } catch (error) {
    console.error("Error while updating:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.getBooking = async (req, res, next) => {
  const token = req.cookies.host_token;
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
        message: "host is not authenticated please login",
      });
    }

    const host = await Host.findOne({ hostid: decoded.Hostid });

    if (!host) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "Host not found",
      });
    }
    const bookings = await Booking.find().populate("user_id", "name profileImage").populate("chef_id", "name profileImage");;
    const bookingHistory=await BookingHistory.find().populate("user_id", "  name profileImage").populate("chef_id", " name profileImage");;
    const pendingbooking=bookings.map((booking)=>{
      return {
        bookedAt:booking.bookedAt,
        id:booking._id,
        time:booking.time,
        user:booking.user_id,
        chef:booking.chef_id,
        date:booking.date,
        fees:booking.totalPrice,
        status:"pending",
      }
    });
    const histbooking=bookingHistory.map((booking)=>{
      return{
        bookedAt:booking.bookedAt,
        id:booking._id,
        user:booking.user_id,
        chef:booking.chef_id,
        date:booking.date,
        fees:booking.totalPrice,
        status:booking.status,
      };
    })
    const allbooking=[...pendingbooking,...histbooking];


    return res.status(201).json({
      allbooking,
      status: "success",
    });
  } catch (error) {
    console.error("Error while geting data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.getYourBookings = async (req, res, next) => {
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
    const bookings = await Booking.find({ user_id: existingUser._id }).populate(
      "chef_id",
      "name profileImage _id type mobile"
    );

    return res.status(201).json({
      userBookingData: bookings,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send user detail:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.cancelBooking = async (req, res, next) => {
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

    const booking = await Booking.findByIdAndDelete({
      _id: new Mongoose.Types.ObjectId(req.body.id),
    });
    if (!booking) {
      const bookhist=await BookingHistory.findOne({date:req.body.date,time:req.body.time,chef_id:req.body.chefid,bookedAt:req.body.bookedAt}).populate("chef_id", "name profileImage _id type");
      if(!bookhist){
        return res
          .status(404)
          .json({ message: "Booking not found", id: req.body.id });
      }
      return  res
        .status(400)
        .json({ message: `Booking already ${bookhist.status}`, id: req.body.id, bookinghistdata:bookhist ,});
    }
    const bookinghistory = new BookingHistory({
      chef_id: booking.chef_id,
      user_id: booking.user_id,
      totalPrice: booking.totalPrice,
      date: booking.date,
      time: booking.time,
      Address: booking.Address,
      modeOfPayment: booking.modeOfPayment,
      bookedAt: booking.bookedAt,
      status: "cancelled",
    });
    const confirmcancelled = await bookinghistory.save();
    const populatedcancelledBooking = await BookingHistory.findById(
      confirmcancelled._id
    ).populate("chef_id", "name profileImage _id type");

    return res.status(201).json({
      cancelledBooking: populatedcancelledBooking,
      id: booking._id,
      status: "success",
    });
  } catch (error) {
    console.error("Error while cancel booking:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.getBookingTime = async (req, res, next) => {
  try {
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
    const bookings = await Booking.find({
      chef_id: new Mongoose.Types.ObjectId(req.body.chefid),
      date: req.body.date,
    });
    const times = bookings.map((booking) => {
      return booking.time;
    });
    return res.status(201).json({
      times: times,
      status: "success",
    });
  } catch (err) {
    console.error("Error while loading free time of chef:", err);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.getPreBookingInfo = async (req, res, next) => {
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
    if(existingUser.status===false){
       return res.status(403).json({
        message: "Your Account is Blocked from Host side for further info please contact us",
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
    const booking = await Booking.findOne({
      chef_id: new Mongoose.Types.ObjectId(req.body.chefid),
      date: req.body.bookinfo.day,
      time: req.body.bookinfo.time,
    });
    if (booking) {
      return res.status(422).json({
        message: "chef is already booked at that time",
        status: "fail",
      });
    }
    const basePrice = existingchef.price;
    const totalPrice = basePrice + basePrice * gstRate;
    return res.status(201).json({
      price: totalPrice,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send user detail:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.confirmBooking = async (req, res, next) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (req.body.date === todayStr && req.body.time < today.getHours() + 3) {
    res.status(422).json({
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
    if(existingUser.status===false){
       return res.status(403).json({
        message: "Your Account is Blocked from Host side for further info please contact us",
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
      paid: req.body.modeOfPayment === "COD" ? false : true,
    });
    const confirmbooking = await booking.save();
    const populatedConfirmBooking = await Booking.findById(
      confirmbooking._id
    ).populate("chef_id", "name profileImage _id type");

    return res.status(201).json({
      confirmbooking: populatedConfirmBooking,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send user detail:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};
