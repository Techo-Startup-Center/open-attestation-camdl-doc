const {
  verifySignature,
  validateSchema,
  getData,
} = require("@govtechsg/open-attestation");
const { getDnsTxt } = require("../utils/dns");
const { verifyDocWithContract } = require("../utils/contract");

const verifyDocument = async (wrappedDoc) => {
  const validatedSchema = validateSchema(wrappedDoc);
  if (!validatedSchema) {
    const msg = "Wrapped document is not valid";
    const err = new Error(msg);
    err.status = 400;
    err.code = "BAD_REQUEST";
    err.message = msg;
    throw err;
  }

  const signVerified = verifySignature(wrappedDoc);
  if (!signVerified) {
    const msg = "Document signature is not valid";
    const err = new Error(msg);
    err.status = 400;
    err.code = "BAD_REQUEST";
    err.message = msg;
    throw err;
  }

  const document = getData(wrappedDoc);
  const verifyResults = [];
  for (const issuer of document.issuers) {
    let idProof = issuer.identityProof;
    let url = idProof.location;
    let type = idProof.type;
    let dns = undefined;

    if (type === "DNS-TXT") {
      let dnsResults = await getDnsTxt(url);
      for (const result of dnsResults) {
        if (issuer.documentStore.toLowerCase() === result.addr.toLowerCase()) {
          dns = result;
          break;
        }
      }

      if (dns === undefined) {
        verifyResults.push({ issuer, status: "UNVERIFIED_DNS_TXT" });
        continue;
      }

      let contractVerification = await verifyDocWithContract(
        dns.netId,
        dns.addr,
        wrappedDoc.signature.targetHash,
        wrappedDoc.signature.merkleRoot
      );

      if (contractVerification === "INVALID") {
        await new Promise((resolve) =>
          setTimeout(resolve, process.env.RETRY_DELAY)
        );
        contractVerification = await verifyDocWithContract(
          dns.netId,
          dns.addr,
          wrappedDoc.signature.targetHash,
          wrappedDoc.signature.merkleRoot
        );
      }

      verifyResults.push({ issuer, status: contractVerification });
    } else {
      const msg = "Unsupport identity proof type provider";
      const err = new Error(msg);
      err.status = 400;
      err.code = "BAD_REQUEST";
      err.message = msg;
      throw err;
    }
  }

  const data = getData(wrappedDoc);
  return { results: verifyResults, data };
};

module.exports = verifyDocument;
