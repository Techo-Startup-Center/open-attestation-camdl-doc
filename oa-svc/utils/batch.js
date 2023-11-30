const { wrapDocuments } = require("@govtechsg/open-attestation");
const { listDocuments, updateDocumentStatus } = require("./mongo");

const processBatch = async () => {
  const documents = await listDocuments();
  if (!documents || documents.length === 0) {
    return;
  }
  const wrappedDocuments = wrapDocuments(
    documents.map((doc) => doc.docToIssue)
  );
  const merkleRoot = wrappedDocuments[0].signature.merkleRoot;

  for (let i = 0; i < documents.length; i++) {
    await updateDocumentStatus(
      documents[i]._id,
      wrappedDocuments[i].signature.targetHash,
      merkleRoot,
      wrappedDocuments[i]
    );
  }

  console.log("Wrapped documents count:", documents.length);
  return merkleRoot;
};

module.exports = { processBatch };
