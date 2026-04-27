const express = require("express");
const userRouter = express.Router();
const userController = require("../controller/userController");
const { uploadDisk, uploadMemory } = require("../utils/uploadUtil");

userRouter.post(
  "/addUserData",
  uploadMemory.single("image"),
  userController.userAdd,
);
userRouter.post(
  "/updateUserData",
  uploadMemory.single("image"),
  userController.userUpdate,
);
userRouter.post(
  "/updateUserProfilePic",
  uploadMemory.single("image"),
  userController.userProfilePicUpdate,
);
userRouter.post(
  "/updateUserProfilePicv2",
  uploadMemory.single("image"),
  userController.userProfilePicUpdatev2,
);
userRouter.get("/userDetail", userController.userData);
userRouter.get("/get-users", userController.getAllUser);
userRouter.post("/changeuserstatus", userController.changeUserStatus);
module.exports = userRouter;
