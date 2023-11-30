const mongoose = require("mongoose");
require("mongoose-type-url");

const documentSchema = new mongoose.Schema({
  issuedStatus: { type: Boolean, default: false },
  createdDate: { type: Date, default: Date.now },
  docToIssue: Object,
  issuedDate: Date,
  targetHash: String,
  merkleRoot: String,
  wrappedDoc: Object,
  revokedDate: Date,
});

module.exports = mongoose.model("Document", documentSchema);
