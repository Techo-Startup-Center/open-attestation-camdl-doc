const mongoose = require("mongoose");
require("mongoose-type-url");

const lockIssueSchema = new mongoose.Schema({
    status: Boolean
});

module.exports = mongoose.model("lockIssue", lockIssueSchema);
