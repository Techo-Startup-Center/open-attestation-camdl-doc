const { Router } = require("express");
const revokeDocuments = require("../services/revoke");

const router = Router();

router.post("/revoke", async (req, res, next) => {
  try {
    if (!req.body.targetHashes) {
      const msg = "targetHashes is required";
      const err = new Error(msg);
      err.status = 400;
      err.message = msg;
      throw err;
    }
    await revokeDocuments(req.body.targetHashes);
    res.send({ status: "REVOKED" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
