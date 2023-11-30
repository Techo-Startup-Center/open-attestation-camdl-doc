const mongoose = require("mongoose");
require("mongoose-type-url");

// * For some reason, can't save url as string in mongo
const callbackSchema = new mongoose.Schema({
  url: { type: mongoose.SchemaTypes.Url, require: true },
  active: { type: Boolean, default: true },
  issuedDoc: { type: Object, require: true },
  error: { type: String, require: true },
  created: { type: Date, default: Date.now },
  callDate: Date,
});

module.exports = mongoose.model("failedcallback", callbackSchema);
