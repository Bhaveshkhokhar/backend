const Service = require("../model/service");
exports.getService = async (req, res, next) => {
  try {
    const services = await Service.find();
    res.status(201).json(services);
  } catch (err) {
    console.log("error encounter" ,err);
  }
};
