const mongoose = require("mongoose");

const merkleRootSchema = new mongoose.Schema({
  issued: { type: Boolean, default: false },
  created: { type: Date, default: Date.now },
  issuedDate: Date,
  issuedRoot: { type: String, require: true },
});

module.exports = mongoose.model("MerkleRoot", merkleRootSchema);
