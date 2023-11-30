const mongoose = require("mongoose");
const { processBatch } = require("../utils/batch");
const mongoConnect = require("../config/mongo");
const { saveMerkleRoot } = require("../utils/mongo");

mongoose.connect(mongoConnect);
let running = false;

setInterval(async () => {
  if (running) {
    return;
  }

  running = true;
  try {
    const merkleRoot = await processBatch();
    if (merkleRoot) {
      await saveMerkleRoot(merkleRoot)
    }
  } catch(err) {
    console.error("Process batch error:", err);
  } finally {
    running = false;
  }

}, process.env.BATCH_DELAY * 1000);
