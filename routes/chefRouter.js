const express = require("express");
const chefRouter = express.Router();
const chefController = require("../controller/chefController");
const { uploadMemory } = require("../utils/uploadUtil");

chefRouter.get("/get-chefs", chefController.getAllChef);
chefRouter.post(
  "/hostchefchangeavailablity",
  chefController.hostchangechefAvailability,
);
chefRouter.post(
  "/addChefData",
  uploadMemory.single("image"),
  chefController.addChef,
);
chefRouter.get("/get-chefsHost", chefController.getAllChefHost);
chefRouter.get("/chefcheckauthstatus", chefController.chefChekAuthStatus);
chefRouter.post("/cheflogin", chefController.postChefLogin);
chefRouter.post("/cheflogout", chefController.postChefLogout);
chefRouter.get("/getchefProfile", chefController.getChefProfile);
chefRouter.post(
  "/updateChefProfilePic",
  uploadMemory.single("image"),
  chefController.updateChefProfilePic,
);
chefRouter.post(
  "/updateChefData",
  uploadMemory.single("image"),
  chefController.updateChefProfile,
);
chefRouter.post("/addChefAccountRequest", uploadMemory.single("image"), chefController.addChefAccountRequest);
chefRouter.post("/chefOtpRequest", chefController.chefOtpRequest);
chefRouter.post("/chefOtpVerify",chefController.chefOtpVerify);
module.exports = chefRouter;
