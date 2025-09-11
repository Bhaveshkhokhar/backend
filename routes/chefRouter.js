const express = require("express");
const chefRouter = express.Router();
const chefController = require("../controller/chefController");

chefRouter.get("/get-chefs", chefController.getAllChef);
chefRouter.post("/hostchefchangeavailablity",chefController.hostchangechefAvailability);
chefRouter.post("/addChefData",chefController.addChef);
chefRouter.get("/get-chefsHost",chefController.getAllChefHost);
chefRouter.get("/chefcheckauthstatus",chefController.chefChekAuthStatus);
chefRouter.post("/cheflogin",chefController.postChefLogin);
chefRouter.post("/cheflogout",chefController.postChefLogout);
chefRouter.get("/getchefProfile",chefController.getChefProfile);
chefRouter.post("/updateChefProfilePic",chefController.updateChefProfilePic);
chefRouter.post("/updateChefData",chefController.updateChefProfile);
module.exports = chefRouter;
