const Document = require("../models/document");
const FailedCallback = require("../models/failedCallback");
const MerkleRoot = require("../models/merkleroot");

const saveDocument = async (docToIssue) => {
  const savedDoc = await Document.create({
    docToIssue,
  });

  return savedDoc;
};

const listDocuments = async () => {
  const documents = await Document.find({ issuedStatus: false });
  return documents;
};

const updateDocumentStatus = async (id, targetHash, merkleRoot, wrappedDoc) => {
  const updatedDoc = await Document.findByIdAndUpdate(
    id,
    {
      issuedStatus: true,
      docToIssue: null,
      targetHash,
      issuedDate: new Date(),
      merkleRoot,
      wrappedDoc,
    },
    { new: true }
  );

  return updatedDoc.refId;
};

const saveMerkleRoot = async (merkleRoot) => {
  const savedMerkleRoot = await MerkleRoot.create({
    issuedRoot: merkleRoot,
  });

  return savedMerkleRoot.issuedRoot;
};

const listNonActiveMerkleRoot = async () => {
  const roots = await MerkleRoot.find({ issued: false });

  return roots;
};

const updateMerkleRoot = async (id) => {
  const updatedRoot = await MerkleRoot.findByIdAndUpdate(
    id,
    { issued: true, issueDate: new Date() },
    { new: true }
  );
  console.log("update root:", updatedRoot);
  return updatedRoot;
};

const updateMerkleRootByRoot = async (root) => {
  const updatedRoot = await MerkleRoot.findOneAndUpdate(
    { issuedRoot: root.slice(2) },
    { issued: true, issuedDate: new Date() },
    { new: true }
  );
  return updatedRoot;
};

const updateRevokeDocument = async (targetHash) => {
  const updatedDocument = await Document.findOneAndUpdate(
    { targetHash },
    { revokedDate: new Date() },
    { new: true }
  );

  return updatedDocument;
};

module.exports = {
  saveDocument,
  updateDocumentStatus,
  updateMerkleRootByRoot,
  saveMerkleRoot,
  listNonActiveMerkleRoot,
  listDocuments,
  updateMerkleRoot,
  updateRevokeDocument,
};
