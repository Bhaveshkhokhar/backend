const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Host = require("../model/host");
require("dotenv").config();
const secret = process.env.SECRET_KEY;

exports.getHostAuthStatus=async(req,res,next)=>{
   const token = req.cookies.host_token;
  
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
          message:"Host is not authenticated",
        })
      }
  
      const existingHost = await Host.findOne({ hostid: decoded.Hostid});
      if (!existingHost) {
        return res.status(404).json({
          isLoggedIn: false,
          message: "Host not found",
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
exports.postHostLogin=async(req,res,next)=>{
  const { Hostid,Password,rememberMe } = req.body;
    try {
      // Check if the user exists
  
      const host = await Host.findOne({ hostid: Hostid });
      // If user does not exist, return an error
      if (!host) {
        return res.status(401).json({
          status: "fail",
          message: "credentials do not match",
        });
      }
  
      // If user exists, check if the password is correct
      const isPasswordValid = Password=== host.password;
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
          Hostid: host.hostid,
        },
        secret,
        { expiresIn: rememberMe?"7d":"1h"}
      );
  
      // Set the token in the response cookies
      res.cookie("host_token", token, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: "Lax", // Adjust based on your requirements
        maxAge: rememberMe? 604800000:3600000, // 7day or 1 hour
      });
  
      // Return a success response
      res.status(201).json({
        status: "success",
        message: "Host logged in successfully",
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
exports.postHostLogout=async(req,res,next)=>{
   try {
    const token = req.cookies.host_token;

    if (!token) {
      return res.status(400).json({
        status: "fail",
        message: "No token found in cookies",
      });
    }

    // Clear the token cookie
    res.clearCookie("host_token", {
      httpOnly: true,
      secure: false, // ✅ Set to true in production (HTTPS)
      sameSite: "Lax",
    });

    res.status(200).json({
      status: "success",
      message: "Host logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during logout",
    });
  }
};