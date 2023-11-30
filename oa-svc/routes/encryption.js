const { encryptString, decryptString } = require("@govtechsg/oa-encryption");
const { Router } = require("express");

const router = Router();

router.post("/encrypt", async (req, res, next) => {
  try {
    const document = req.body;
    const encryptedDocument = encryptString(JSON.stringify(document));
    res.send(encryptedDocument);
  } catch (err) {
    err.status = 500;
    err.message = "Failed to encrypt document";
    next(err);
  }
});

router.post("/decrypt", async (req, res, next) => {
  try {
    const encryptedDocument = req.body;
    const decryptedDocument = decryptString(encryptedDocument);
    res.send(JSON.parse(decryptedDocument));
  } catch (err) {
    err.status = 500;
    err.message = "Failed to decrypt document";
    console.log(err);
    next(err);
  }
});

module.exports = router;
