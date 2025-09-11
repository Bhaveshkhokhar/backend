const express=require("express");
const bookingRouter=express.Router();
const bookingController=require("../controller/bookingController");

bookingRouter.get("/getYourBookings",bookingController.getYourBookings);
bookingRouter.post("/cancelBooking",bookingController.cancelBooking);
bookingRouter.post("/getbookingtime",bookingController.getBookingTime);
bookingRouter.post("/handlePreBooking",bookingController.getPreBookingInfo);
bookingRouter.post("/confirmBooking",bookingController.confirmBooking);
bookingRouter.get("/get-bookings",bookingController.getBooking);
bookingRouter.post("/hostbookingcancel",bookingController.hostCancelBooking);
bookingRouter.get("/get-Chefbookings",bookingController.getChefBookings);
bookingRouter.post("/chefbookingupdate",bookingController.chefBookingUpdate);

module.exports=bookingRouter;