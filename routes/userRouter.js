const express= require("express");
const userRouter=express.Router();
const userController=require("../controller/userController");

userRouter.post("/addUserData",userController.userAdd);
userRouter.post("/updateUserData",userController.userUpdate);
userRouter.post("/updateUserProfilePic",userController.userProfilePicUpdate);
userRouter.get("/userDetail",userController.userData);
userRouter.get("/get-users",userController.getAllUser)
userRouter.post("/changeuserstatus",userController.changeUserStatus);
module.exports=userRouter;