const express=require("express");
const hostRouter=express.Router();
const hostController=require("../controller/hostController")

hostRouter.get("/hostcheckauthstatus",hostController.getHostAuthStatus);
hostRouter.post("/hostlogin",hostController.postHostLogin);
hostRouter.post("/hostlogout",hostController.postHostLogout);

module.exports=hostRouter;