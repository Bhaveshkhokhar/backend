const express = require("express");
const serviceRouter = express.Router();
const serviceController = require("../controller/serviceController");

serviceRouter.get("/service", serviceController.getService);

module.exports = serviceRouter;
