const { Router } = require("express");
const verifyDocument = require("../services/verify");

router = Router();

router.post("/", async (req, res, next) => {
  try {
    const results = await verifyDocument(req.body);
    res.send(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
