const { Contact } = require("../model/contact");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Host = require("../model/host");
require("dotenv").config();
const secret = process.env.SECRET_KEY;
exports.createContact = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),
  check("mobile")
    .trim()
    .notEmpty()
    .withMessage("Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be 10 digits")
    .isNumeric()
    .withMessage("Mobile number must contain only digits"),
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  check("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isIn([
      "Delhi",
      "Mumbai",
      "Bangalore",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Lucknow",
      "Pune",
    ])
    .withMessage("City must be one of the specified options"),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        status: "fail",
        field: errors.array()[0].param,
        message: errors.array()[0].msg,
      });
    }
    const { name, email, city, mobile, message } = req.body;

    try {
      const contact = new Contact({
        name,
        email,
        city,
        mobile,
        message,
      });

      await contact.save();
      res
        .status(201)
        .json({ message: "Request created successfully", contact });
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];
exports.getRequests = async (req, res, next) => {
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
    const requests = await Contact.find();

    return res.status(201).json({
      requests,
      status: "success",
    });
  } catch (error) {
    console.error("Error while geting data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};
exports.read=async(req,res,next)=>{
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
    const request =  await Contact.updateOne({ _id: req.body.id }, { $set: { read: true } });
    if(!request){
      return res.status(404).json({
        message: " request not found",
      });
    }
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
