const express= require("express");
const rozarPayRouter=express.Router();
const rozarPayController=require("../controller/rozarPayController");


rozarPayRouter.post("/createOrder",rozarPayController.createOrder);
rozarPayRouter.post("/verifyPayment",rozarPayController.verifyPayment);
rozarPayRouter.post("/retryPayment",rozarPayController.retryPayment);



module.exports=rozarPayRouter;