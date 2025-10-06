const Chef = require("../model/chef");
const Host = require("../model/host");
const jwt = require("jsonwebtoken");
const Mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const secret = process.env.SECRET_KEY;
const { check, validationResult } = require("express-validator");

exports.updateChefProfile = [
  check("Name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),

  check("Price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((val) => val >= 0)
    .withMessage("Price must be non-negative"),

  check("Type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn([
      "One-Time Service",
      "Chef's Table",
      "Chef for Party",
      "Chef Subscription",
    ])
    .withMessage("Type must be a valid option"),

  check("Speciality")
    .trim()
    .notEmpty()
    .withMessage("Speciality is required")
    .isLength({ min: 2 })
    .withMessage("Speciality must be at least 2 characters"),

  check("Bio")
    .trim()
    .notEmpty()
    .withMessage("Bio is required")
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),

  check("Certifications")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.split(",").map((v) => v.trim());
      }
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("At least one certification is required")
    .custom((certs) => certs.every((c) => typeof c === "string"))
    .withMessage("Each certification must be a string"),

  check("Experience")
    .notEmpty()
    .withMessage("Experience is required")
    .isNumeric()
    .withMessage("Experience must be a number")
    .custom((val) => val >= 0)
    .withMessage("Experience must be non-negative"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: "fail",
        field: errors.array()[0].param,
        message: errors.array()[0].msg,
      });
    }

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

      const existingchef = await Chef.findOne({ mobile: decoded.Number });
      if (!existingchef) {
        return res.status(404).json({
          status: fail,
          message: "Chef not found in Database",
        });
      }
      await Chef.updateOne(
        { mobile: decoded.Number },
        {
          name: req.body.Name,
          type: req.body.Type,
          price: Number(req.body.Price),
          speciality: req.body.Speciality,
          bio: req.body.Bio,
          experience: Number(req.body.Experience),
          certifications: Array.isArray(req.body.Certifications)
            ? req.body.Certifications
            : req.body.Certifications?.split(",").map((c) => c.trim()),
        }
      );

      return res.status(201).json({
        status: "success",
        message: "Details are Updated",
      });
    } catch (error) {
      console.error("Error updating chef details:", error);
      res
        .status(500)
        .json({ message: "Internal server error please try after some time" });
    }
  },
];

exports.updateChefProfilePic = async (req, res, next) => {
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
    if (req.file) {
      existingChef.profileImage = `/upload/${req.file.filename}`;
    } else {
      return res.status(404).json({
        status: fail,
        message: "File not Found",
      });
    }
    await existingChef.save();

    return res.status(201).json({
      status: "success",
      message: "Profile Image is updated",
      image: existingChef.profileImage,
    });
  } catch (error) {
    console.error("Error add user details:", error);
    res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.getChefProfile = async (req, res, next) => {
  const token = req.cookies.chef_token;
  if (!token) {
    res.status(401).json({
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
    const data = {
      id: existingChef._id,
      name: existingChef.name,
      number: existingChef.mobile,
      price: existingChef.price,
      image: existingChef.profileImage,
      speciality: existingChef.speciality,
      bio: existingChef.bio,
      experience: existingChef.experience,
      available: existingChef.available,
      type: existingChef.type,
      rating: existingChef.rating,
      certifications: existingChef.certifications,
    };
    return res.status(201).json({
      chef: data,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send chef detail:", error);
    res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};

exports.postChefLogout = async (req, res, next) => {
  try {
    const token = req.cookies.chef_token;

    if (!token) {
      return res.status(400).json({
        status: "fail",
        message: "No token found in cookies",
      });
    }

    // Clear the token cookie
    res.clearCookie("chef_token", {
      httpOnly: true,
      secure: true, // ✅ Set to true in production (HTTPS)
      sameSite: "None", // ✅ Set to 'None' in production
    });

    res.status(200).json({
      status: "success",
      message: "Chef logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      status: "error",
      message: "Internal server error during logout",
    });
  }
};

exports.chefChekAuthStatus = async (req, res, next) => {
  const token = req.cookies.chef_token;

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
        isLoggedIn: false,
        message: "Chef is not authenticated",
      });
    }

    const existingChef = await Chef.findOne({ mobile: decoded.Number });
    if (!existingChef) {
      return res.status(404).json({
        isLoggedIn: false,
        message: "Chef not found in Database",
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

exports.postChefLogin = async (req, res, next) => {
  const { Chefnumber, Password, rememberMe } = req.body;
  try {
    // Check if the user exists

    const chef = await Chef.findOne({ mobile: Chefnumber });
    // If user does not exist, return an error
    if (!chef) {
      return res.status(401).json({
        status: "fail",
        message: "credentials do not match",
      });
    }

    // If user exists, check if the password is correct
    const isPasswordValid = await bcrypt.compare(Password, chef.password);
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
        Number: chef.mobile,
      },
      secret,
      { expiresIn: rememberMe ? "7d" : "1h" }
    );

    // Set the token in the response cookies
    res.cookie("chef_token", token, {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: "None", // Adjust based on your requirements
      maxAge: rememberMe ? 604800000 : 3600000, // 1 hour
    });

    // Return a success response
    res.status(201).json({
      status: "success",
      message: "Chef logged in successfully",
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

exports.addChef = [
  check("Name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),

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
  check("Number")
    .trim()
    .notEmpty()
    .withMessage("Number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be 10 digits")
    .isNumeric()
    .withMessage("Mobile number must contain only digits")
    .custom(async (value) => {
      const existingchef = await Chef.findOne({ mobile: value });
      if (existingchef) {
        throw new Error("Mobile number already have an account");
      }
    }),
  check("Price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .custom((val) => val >= 0)
    .withMessage("Price must be non-negative"),

  check("Available")
    .notEmpty()
    .withMessage("Availability is required")
    .isBoolean()
    .withMessage("Availability must be true or false"),

  check("Type")
    .notEmpty()
    .withMessage("Type is required")
    .isIn([
      "One-Time Service",
      "Chef's Table",
      "Chef for Party",
      "Chef Subscription",
    ])
    .withMessage("Type must be a valid option"),

  check("Speciality")
    .trim()
    .notEmpty()
    .withMessage("Speciality is required")
    .isLength({ min: 2 })
    .withMessage("Speciality must be at least 2 characters"),

  check("Bio")
    .trim()
    .notEmpty()
    .withMessage("Bio is required")
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),

  check("Certifications")
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.split(",").map((v) => v.trim());
      }
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("At least one certification is required")
    .custom((certs) => certs.every((c) => typeof c === "string"))
    .withMessage("Each certification must be a string"),

  check("Experience")
    .notEmpty()
    .withMessage("Experience is required")
    .isNumeric()
    .withMessage("Experience must be a number")
    .custom((val) => val >= 0)
    .withMessage("Experience must be non-negative"),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: "fail",
        field: errors.array()[0].param,
        message: errors.array()[0].msg,
      });
    }

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
      const existingchef = await Chef.findOne({ mobile: req.body.Number });
      if (existingchef) {
        return res.status(409).json({
          status: fail,
          message: "Chef already exist in Database",
        });
      }
      if (!req.file) {
        return res.status(404).json({
          status: fail,
          message: "profile image is required",
        });
      }
      const hashedPassword = await bcrypt.hash(req.body.Password, 10);
      const chef = {
        mobile: req.body.Number,
        password: hashedPassword,
        profileImage: `/upload/${req.file.filename}`,
        name: req.body.Name,
        available: req.body.Available === "true" || req.body.Available === true, // ensure boolean
        type: req.body.Type,
        price: Number(req.body.Price),
        speciality: req.body.Speciality,
        bio: req.body.Bio,
        experience: Number(req.body.Experience),
        certifications: Array.isArray(req.body.Certifications)
          ? req.body.Certifications
          : req.body.Certifications?.split(",").map((c) => c.trim()),
        rating: 0, // default
      };

      const chefObject = new Chef(chef);
      const chefData = await chefObject.save();

      return res.status(201).json({
        status: "success",
        message: "details are added",
        id: chefData._id,
        profileImage: chefData.profileImage,
      });
    } catch (error) {
      console.error("Error add user details:", error);
      res
        .status(500)
        .json({ message: "Internal server error please try after some time" });
    }
  },
];

exports.hostchangechefAvailability = async (req, res, next) => {
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
    const chef = await Chef.updateOne(
      { _id: req.body.id },
      { $set: { available: req.body.flag } }
    );
    if (!chef) {
      return res.status(404).json({
        message: " chef not found",
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

exports.getAllChef = async (req, res, next) => {
  try {
    const chefs = await Chef.find();
    res.status(201).json(chefs);
  } catch (err) {
    console.log("error encounter");
  }
};

exports.getAllChefHost = async (req, res, next) => {
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
    const chefs = await Chef.find();
    const abstractchef = chefs.map((chef) => {
      return {
        mobile: chef.mobile,
        _id: chef._id,
        profileImage: chef.profileImage,
        name: chef.name,
        available: chef.available,
        type: chef.type,
        rating: chef.rating,
        price: chef.price,
        speciality: chef.speciality,
        bio: chef.bio,
        experience: chef.experience,
        certifications: chef.certifications,
      };
    });
    return res.status(201).json({
      abstractchef,
      status: "success",
    });
  } catch (error) {
    console.error("Error while geting data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};
