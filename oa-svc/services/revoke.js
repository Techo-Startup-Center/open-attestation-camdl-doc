const { revokeWithContract } = require("../utils/contract");
const { updateRevokeDocument } = require("../utils/mongo");

const revokeDocuments = async (targetHashes) => {
  if (targetHashes.length === 0) {
    const msg = "Empty target hashes";
    const err = new Error(msg);
    err.status = 400;
    err.message = msg;
    throw err;
  }
  await revokeWithContract(targetHashes);
};

module.exports = revokeDocuments;
