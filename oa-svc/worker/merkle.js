const mongoose = require("mongoose");
const moment = require("moment");
const mongoConnect = require("../config/mongo");
const { issueMerkleRoots } = require("../utils/contract");
const { updateMerkleRoot, listNonActiveMerkleRoot } = require("../utils/mongo");

mongoose.connect(mongoConnect);
let running = false;

setInterval(async () => {

  try {
    if (running) {
      return;
    }
    running = true;
    const roots = await listNonActiveMerkleRoot();

    if (roots.length === 0) {
      console.log(
        `INFO ${moment().toISOString()} - No merkle root has been issued`
      );
      running = false;
      return;
    }

    const merkleRoots = roots.map((root) => root.issuedRoot);

    await issueMerkleRoots(merkleRoots);

    Promise.allSettled(
      roots.map(async (root) => await updateMerkleRoot(root._id))
    );
    console.log(
      `INFO ${moment().toISOString()} - Successfully issued roots: ${merkleRoots}`
    );
  } catch (err) {
    console.error(
      `ERROR ${moment().toISOString()} - ${
        err.message || "An unexpected error has occurred"
      }`
    );
  } finally {
    running = false;
  }
}, process.env.ISSUE_DELAY * 1000);
