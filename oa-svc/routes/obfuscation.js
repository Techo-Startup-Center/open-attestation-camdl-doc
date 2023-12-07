const { Router } = require("express");
const { obfuscateDocument } = require("@govtechsg/open-attestation");
const router = Router();

router.post("/obfuscate", async (req, res, next) => {
  try {
    const obfDoc = obfuscateDocument(req.body.document, req.body.fields)
    res.send(obfDoc);
  } catch (err) {
    err.status = 500;
    err.message = "Failed to obfuscate document";
    next(err);
  }
})
module.exports = router;