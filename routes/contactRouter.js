const express = require('express');
const contactController = require('../controller/contactController');
const contactRouter = express.Router();

contactRouter.post('/contact', contactController.createContact);
contactRouter.get("/get-requests",contactController.getRequests);
contactRouter.post("/read",contactController.read);
module.exports = contactRouter;