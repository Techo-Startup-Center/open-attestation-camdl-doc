const { Router } = require("express");
const { wrapDocument, saveDocRealTime } = require("../services/wrap");
const Document = require("../models/document");

const router = Router();

router.post("/wrap", async (req, res, next) => {
  try {
    const savedDocument = await wrapDocument(req.body);
    const trigger = Document.watch([
      {
        $match: {
          "documentKey._id": savedDocument._id,
          operationType: "update",
        },
      },
    ]);

    trigger.on("change", async (data) => {
      await trigger.close();

      res.send(data.updateDescription.updatedFields.wrappedDoc);
    });
  } catch (err) {
    next(err);
  }
});

router.post("/wrap-single", async (req, res, next) => {
  try {
    const wrappedDoc = await saveDocRealTime(req.body);
    res.send(wrappedDoc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
