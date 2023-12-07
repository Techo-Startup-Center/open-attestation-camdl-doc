const express = require("express");
const logger = require("morgan");
const wrapRoute = require("./routes/wrap");
const verifyRoute = require("./routes/verify");
const revokeRoute = require("./routes/revoke");
const encryptionRoute = require("./routes/encryption");
const obfuscateRoute = require("./routes/obfuscation");
const mongoose = require("mongoose");
const moment = require("moment");
const mongoConnect = require("./config/mongo");
const { Worker } = require("node:worker_threads");
const { obfuscate } = require("@govtechsg/open-attestation");

var app = express();
const PORT = process.env.PORT;

// * View engine setup
app.use(logger("dev"));
app.use(express.json({ limit: process.env.SIZE_LIMIT }));

// * Authorization middleware
function isAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (auth === process.env.ADMIN_SECRET) {
    next();
  } else {
    res.status(401);
    res.send({ code: "UNAUTHORIZED", message: "Unauthorized request" });
  }
}

app.use("/api/v1/document", isAuth, wrapRoute);
app.use("/api/v1/document", isAuth, revokeRoute);
app.use("/api/v1/document", isAuth, encryptionRoute);
app.use("/api/v1/verify", verifyRoute);
app.use("/api/v1/document", isAuth, obfuscateRoute );

// * Not found handler
app.use(function (_, res) {
  res.status(404).send({ code: "NOT_FOUND", message: "Resource not found" });
});

// * Global error handler
app.use((err, _, res, __) => {
  console.log(
    `ERROR ${moment().toISOString()} - ${
      err.message || "An unexpected error has occurred"
    }`
  );
  res.status(err.status || 500);
  res.send({
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected error has occurred",
  });
});

// * Bootstrap mongo connection
mongoose.connect(mongoConnect);
const database = mongoose.connection;

database.on("error", (err) => {
  console.log(
    `ERROR ${moment().toISOString()} - Failed to connect to database error: ${err}`
  );
});

database.once("connected", () => {
  console.log(
    `INFO ${moment().toISOString()} - Database connection established`
  );
});

if (!process.env.NODE_TYPE) {
  throw Error("NODE_TYPE undefined");
}

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      `INFO ${moment().toISOString()} - Server started successfully on port: ${PORT}`
    );
    // Initiate worker
    if (process.env.NODE_TYPE === "MASTER") {
      new Worker("./worker/processBatch.js");
      new Worker("./worker/merkle.js");
    } else if (process.env.NODE_TYPE !== "WORKER") {
      throw Error(
        'Incorrect node type config. Only "WORKER" & "MASTER" are allowed.'
      );
    }
  } else {
    console.log(
      `ERROR ${moment().toISOString()} - Failed to start server error: ${error}`
    );
  }
});

module.exports = app;
