const mongose = require("mongoose");
const HostSchema = new mongose.Schema({
  name: { type: String, required: true },
  hostid: { type: String, required: true },
  password: { type: String, required: true },
});
module.exports = mongose.model("Host", HostSchema);
