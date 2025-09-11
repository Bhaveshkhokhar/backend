const User = require("../model/user");
const jwt = require("jsonwebtoken");
const Host=require("../model/host");
require("dotenv").config();
const secret = process.env.SECRET_KEY;
const { check, validationResult } = require("express-validator");
const user = require("../model/user");

exports.changeUserStatus=async(req,res,next)=>{
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
      const user = await User.updateOne(
        { _id: req.body.id },
        { $set: { status: req.body.status } }
      );
      if (!user) {
        return res.status(404).json({
          message: "user not found",
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
}
exports.getAllUser=async(req,res,next)=>{
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
    const users = await User.find();
    const usersdetail=users.map((user)=>{
      return {
      id:user._id,
      email:user.email,
      name:user.name,
      mobile:user.mobile,
      gender:user.gender,
      image:user.profileImage,
      status:user.status,
    };
    });
    return res.status(201).json({
      usersdetail,
      status: "success",
    });
  } catch (error) {
    console.error("Error while geting data:", error);
    return res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
}
exports.userProfilePicUpdate = async (req, res, next) => {
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
    if (req.file) {
      existingUser.profileImage = `/upload/${req.file.filename}`;
    }
    await existingUser.save();

    return res.status(201).json({
      status: "success",
      message: "Profile Image is updated",
      image:existingUser.profileImage,
    });
  } catch (error) {
    console.error("Error add user details:", error);
    res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};
exports.userAdd = [
  check("Name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),

  check("Email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),

  check("Address").trim(),

  check("Gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be either male, female, or others"),

  check("Birthdate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Birthdate must be a valid date")
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      if (inputDate > today) {
        throw new Error("Birthdate cannot be in the future");
      }
      return true;
    }),

  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        status: "fail",
        field: errors.array()[0].param,
        message: errors.array()[0].msg,
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
      if (req.file) {
        existingUser.profileImage = `/upload/${req.file.filename}`;
      }
      existingUser.name = req.body.Name;
      if (req.body.Email) {
        existingUser.email = req.body.Email;
      } else {
        existingUser.email = "";
      }
      if (req.body.Address) {
        existingUser.address = req.body.Address;
      } else {
        existingUser.address = "";
      }
      if (req.body.Birthdate) {
        existingUser.birthday = req.body.Birthdate;
      } else {
        existingUser.birthday = "";
      }
      existingUser.gender = req.body.Gender;
      await existingUser.save();

      return res.status(201).json({
        status: "success",
        message: "details are added",
        image:req.file?`/upload/${req.file.filename}`:"/defaultpic.jpg",
      });
    } catch (error) {
      console.error("Error add user details:", error);
      res
        .status(500)
        .json({ message: "Internal server error please try after some time" });
    }
  },
];
exports.userUpdate = [
  check("Name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only letters and spaces"),

  check("Email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Invalid email format"),

  check("Address").trim(),

  check("Gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be either male, female, or others"),

  check("Birthdate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Birthdate must be a valid date")
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      if (inputDate > today) {
        throw new Error("Birthdate cannot be in the future");
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({
        status: "fail",
        field: errors.array()[0].param,
        message: errors.array()[0].msg,
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
      existingUser.name = req.body.Name;
      if (req.body.Email) {
        existingUser.email = req.body.Email;
      }else{
        existingUser.email = "";
      }
      if (req.body.Address) {
        existingUser.address = req.body.Address;
      }else{
        existingUser.address = "";
      }
      if (req.body.Birthdate) {
        existingUser.birthday = req.body.Birthdate;
      }else{
        existingUser.birthday = "";
      }
      existingUser.gender = req.body.Gender;
      await existingUser.save();

      return res.status(201).json({
        status: "success",
        message: "details are updated",
      });
    } catch (error) {
      console.error("Error add user details:", error);
      res
        .status(500)
        .json({ message: "Internal server error please try after some time" });
    }
  },
];
exports.userData = async (req, res, next) => {
  const token = req.cookies.user_token;
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
    const data = {
      id:existingUser._id,
      Name: existingUser.name,
      Number: existingUser.mobile,
      Email: existingUser.email,
      Image: existingUser.profileImage,
      Address: existingUser.address,
      Birthdate: existingUser.birthday ? existingUser.birthday : "",
      Gender: existingUser.gender,
      Status:existingUser.status,
    };
    return res.status(201).json({
      userData: data,
      status: "success",
    });
  } catch (error) {
    console.error("Error while send user detail:", error);
    res
      .status(500)
      .json({ message: "Internal server error please try after some time" });
  }
};
