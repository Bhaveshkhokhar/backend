const express= require("express");
const authRouter=express.Router();
const authController=require("../controller/authController");


authRouter.get("/checkauthstatus",authController.getAuthStatus);
authRouter.post("/login",authController.postLogin);
authRouter.post("/otpverification",authController.postOtpVerification);
authRouter.post("/logout",authController.postLogout);
authRouter.post("/signup",authController.postSignup);


module.exports=authRouter;