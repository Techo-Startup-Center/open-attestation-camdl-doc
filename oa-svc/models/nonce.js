const mongoose = require("mongoose");
require("mongoose-type-url");

const nonceSchema = new mongoose.Schema({
    nonce: Number
});

module.exports = mongoose.model("nonce", nonceSchema);
