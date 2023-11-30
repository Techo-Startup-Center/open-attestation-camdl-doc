const { saveMerkleRoot, saveDocument } = require("../utils/mongo");
const { wrapDocuments } = require("@govtechsg/open-attestation");

const wrapDocument = async (document) => {
  const initIssuer = {
    documentStore: process.env.DOCUMENT_STORE,
    identityProof: {
      location: process.env.IDENTITY_LOCATION,
      type: "DNS-TXT",
    },
    name: process.env.ISSUER_NAME,
    url: process.env.ISSUER_URL,
  };

  if (!document.$template?.name) {
    const msg = "Template name is required";
    const err = new Error(msg);
    err.status = 400;
    err.code = "BAD_REQUEST";
    err.message = msg;
    throw err;
  }

  if (!document.issuers) {
    document.issuers = [initIssuer];
  } else if (
    document.issuers.length === 0 ||
    !document.issuers.map((iss) => iss.name).includes(initIssuer.name)
  ) {
    document.issuers.push(initIssuer);
  }

  try {
    const savedDoc = await saveDocument(document);
    return savedDoc;
  } catch (err) {
    err.status = 500;
    err.code = "INTERNAL_SERVER_ERROR";
    err.message = "Failed to save document";
    throw err;
  }
};

const saveDocRealTime = async (document) => {
  const initIssuer = {
    documentStore: process.env.DOCUMENT_STORE,
    identityProof: {
      location: process.env.IDENTITY_LOCATION,
      type: "DNS-TXT",
    },
    name: process.env.ISSUER_NAME,
    url: process.env.ISSUER_URL,
  };

  if (!document.$template?.name) {
    const msg = "Template name is required";
    const err = new Error(msg);
    err.status = 400;
    err.code = "BAD_REQUEST";
    err.message = msg;
    throw err;
  }

  if (!document.issuers) {
    document.issuers = [initIssuer];
  } else if (
    document.issuers.length === 0 ||
    !document.issuers.map((iss) => iss.name).includes(initIssuer.name)
  ) {
    document.issuers.push(initIssuer);
  }

  const wrappedDoc = wrapDocuments([document]);
  const merkleRoot = wrappedDoc[0].signature.merkleRoot;
  await saveMerkleRoot(merkleRoot);

  return wrappedDoc[0];
};

module.exports = { wrapDocument, saveDocRealTime };
