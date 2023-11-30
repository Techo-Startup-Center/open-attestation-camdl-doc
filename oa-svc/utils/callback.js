const axios = require("axios");
const moment = require("moment");
const FailedCallback = require("../models/failedCallback");
const { updateCallback, saveFailedCallback } = require("./mongo");

const pushCallback = async (wrappedDocument, callback) => {
  try {
    await axios.post(callback, wrappedDocument);
    console.log(
      `INFO ${moment().toISOString()} - Successful send callback to ${callback}`
    );
  } catch (err) {
    console.error(
      `ERROR ${moment().toISOString()} - Failed to send callback to ${callback}`
    );
    await saveFailedCallback(callback, wrappedDocument, err);
  }
};

const retryCallback = async () => {
  const callbacks = await FailedCallback.find({ active: true });

  if (callbacks.length === 0) {
    console.log(`INFO ${moment().toISOString()} - No callback has been called`);
    return;
  }

  await Promise.all(
    callbacks.forEach(async (callback) => {
      await updateCallback(callback._id);
      console.log(
        `INFO ${moment().toISOString()} - Updated callback ${callback._id.toString()} `
      );
      await pushCallback(callback.issuedDoc, callback.url);
    })
  );
  console.log(
    `INFO ${moment().toISOString()} - Retried total ${
      callbacks.length
    } callbacks`
  );
};

module.exports = { retryCallback, pushCallback };
