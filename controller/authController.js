const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const User = require("../model/user");
require("dotenv").config();
const secret = process.env.SECRET_KEY;
const accountSid = process.env.ACCOUNTSID;
const authToken = process.env.AUTHTOKEN;

const client = twilio(accountSid, authToken);

exports.getAuthStatus = async (req, res, next) => {
  const token = req.cookies.user_token;

  if (!token) {
    return res.status(401).json({
      isLoggedIn: false,
      message: "No token provided",
    });
  }

  // Check if the token is valid
  // If valid, check if the user exists in the database
  try {
    let decoded;
    try {
       decoded = jwt.verify(token, secret);
      // token is valid
    } catch (err) {
      // token is invalid or expired
      return res.status(401).json({
        isLoggedIn:false,
        message:"user is not authenticated",
      })
    }

    const existingUser = await User.findOne({ mobile: decoded.Number });
    if (!existingUser) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "User not found",
      });
    }
    return res.status(201).json({
      isLoggedIn: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during signup",
    });
  }
};

exports.postLogin = async (req, res, next) => {
  const { Number, Password,rememberMe } = req.body;
  try {
    // Check if the user exists

    const user = await User.findOne({ mobile: Number });
    // If user does not exist, return an error
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "credentials do not match",
      });
    }

    // If user exists, check if the password is correct
    const isPasswordValid = await bcrypt.compare(Password, user.password);
    // If password is incorrect, return an error
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "fail",
        message: "credentials do not match",
      });
    }
    // If password is correct, generate a JWT token
    const token = jwt.sign(
      {
        Number: user.mobile,
      },
      secret,
      { expiresIn: rememberMe?"7d":"1h"}
    );

    // Set the token in the response cookies
    res.cookie("user_token", token, {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      sameSite: "Lax", // Adjust based on your requirements
      maxAge: rememberMe? 604800000:3600000, // 1 hour
    });

    // Return a success response
    res.status(201).json({
      status: "success",
      message: "User logged in successfully",
    });
  } catch (err) {
    console.error(err);
    // Handle any errors that occur during the login process
    res.status(500).json({
      status: "error",
      message: "Internal server error during login",
    });
  }
};

exports.postOtpVerification = [
  //validate name
  check("Name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),

  //validate number
  check("Number")
    .trim()
    .notEmpty()
    .withMessage("Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be 10 digits")
    .isNumeric()
    .withMessage("Mobile number must contain only digits")
    .custom(async (value) => {
      const existingUser = await User.findOne({ mobile: value });
      if (existingUser) {
        throw new Error("Mobile number already have an account");
      }
    }),

  //validate password
  check("Password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  //validate Confirm Password
  check("ConfirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.Password) {
        throw new Error("Confirm Password must match Password");
      }
      return true;
    }),

  async (req, res, next) => {
    const error = validationResult(req);

    if (!error.isEmpty()) {
      res.status(422).json({
        status: "fail",
        field: error.array()[0].param,
        message: error.array()[0].msg,
      });
    }

    try {
      const { Name, Number, Password } = req.body;
      // Check if the user already exists
      const existingUser = await User.findOne({ mobile: Number });
      // If user exists, return an error
      if (existingUser) {
        return res.status(409).json({
          status: "fail",
          message: "Mobile number already have an account",
        });
      }
      // If user does not exist, create a new user
      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(Password, 10);

      // Generate a random OTP (4-digit number)
      const otp = Math.floor(1000 + Math.random() * 9000);

      //create session
      req.session.otp = otp;
      req.session.Name = Name;
      req.session.Number = Number;
      req.session.Password = hashedPassword;

      await client.messages.create({
        body: `Your OTP for Chef Booking is ${otp}. It will expire in 5 minutes.`,
        from: "+13803240507",
        to: `+91${Number}`,
      });
      // Create a new user instance

      // Return a success response
      res.status(201).json({
        status: "otp generated",
        message: "otp sent to your mobile number",
      });
    } catch (err) {
      console.error(err);
      // Handle any errors that occur during the signup process
      res.status(500).json({
        status: "error",
        message: "Internal server error during signup",
      });
    }
  },
];

exports.postSignup = async (req, res, next) => {
  const { Otp ,rememberMe} = req.body;
  if (!req.session.otp) {
    return res.status(400).json({
      status: "fail",
      message: "OTP session expired or not found",
    });
  }
  try {
    if (Otp != req.session.otp) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP",
      });
    }
    // If OTP is valid, create a new user
    const { Name, Number, Password } = req.session;

    const newUser = new User({
      name: Name,
      mobile: Number,
      password: Password,
    });

    // Save the new user to the database
    await newUser.save();

    // Generate a JWT token for the user
    const token = jwt.sign(
      {
        Number: newUser.mobile,
      },
      secret,
      { expiresIn: rememberMe?"7d":"1h" }
    );

    // Set the token in the response cookies
    res.cookie("user_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: rememberMe? 604800000:3600000, // 1hour
    });
    // Clear the session after successful signup
    await req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
    });

    // Return a success response
    res.status(201).json({
      status: "success",
      message: "User signed up successfully",
    });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error during signup",
    });
  }
};

exports.postLogout = async (req, res, next) => {
  try {
    const token = req.cookies.user_token;

    if (!token) {
      return res.status(400).json({
        status: "fail",
        message: "No token found in cookies",
      });
    }

    // Clear the token cookie
    res.clearCookie("user_token", {
      httpOnly: true,
      secure: false, // ✅ Set to true in production (HTTPS)
      sameSite: "Lax",
    });

    res.status(200).json({
      status: "success",
      message: "User logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during logout",
    });
  }
};
// // This code handles user authentication, including login, signup, and logout functionalities.
// It uses JWT for session management and bcrypt for password hashing.
