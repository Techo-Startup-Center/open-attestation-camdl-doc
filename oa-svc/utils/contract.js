const { Wallet, JsonRpcProvider } = require("ethers");
const Web3 = require("web3");
const getNetworkById = require("./network");
const openattestationABI = require("./abi");
const docuStore = require("@govtechsg/document-store");
const fs = require("fs");
const dotenv = require("dotenv");
const { updateMerkleRootByRoot, updateRevokeDocument } = require("./mongo");
const nonceRespository = require("../models/nonce");
const lockRespository = require("../models/issueLock");
dotenv.config();

const networks = {
  "camdl-staging": {
    explorer: "https://explorer.staging.camdl.gov.kh",
    provider: "https://rpc1.staging.camdl.gov.kh",
    networkId: 295,
    networkName: "CamDL Staging",
    currency: "CADL",
  },
  "camdl-testnet": {
    explorer: "https://explorer.testnet.camdl.gov.kh",
    provider: "https://rpc1.testnet.camdl.gov.kh",
    networkId: 195,
    networkName: "CamDL Testnet",
    currency: "CADL",
  },
  camdl: {
    explorer: "https://explorer.camdl.gov.kh",
    provider: "https://rpc1.camdl.gov.kh",
    networkId: 95,
    networkName: "CamDL Mainnet",
    currency: "CADL",
  },
  local: {
    explorer: "https://localhost/explorer",
    provider: "http://127.0.0.1:8545",
    networkId: 1337,
    networkName: "local",
    currency: "ETH",
  },
};

function getNetwork() {
  const networkString = process.env.NETWORK;
  return networks[networkString];
}

function getProvider() {
  const localNetwork = getNetwork();
  if (localNetwork) {
    let provider = new JsonRpcProvider(localNetwork.provider, undefined, {
      polling: true,
    });
    provider.pollingInterval = 300;
    return provider;
  } else {
    return new providers.InfuraProvider(networkString);
  }
}

function getSigner() {
  let walletJson = fs.readFileSync(process.env.WALLET_FILE);
  return Wallet.fromEncryptedJsonSync(walletJson, process.env.WALLET_PWD);
}

async function issueMerkleRoots(roots) {
  if (!roots || roots.length === 0) {
    return;
  }
  if (await getLockIssueState()) {
    return;
  }
  let merkleRoots = roots.map((root) =>
    root.slice(0, 2) === "0x" ? root : "0x" + root
  );
  try {
    await lockIssueState(true);
    let signer = getSigner();
    const provider = getProvider();
    signer = signer.connect(provider);
    let documentStore;
    documentStore = await docuStore.connect(process.env.DOCUMENT_STORE, signer);
    let tx;
    if (roots.length > 1) {
      tx = await documentStore.bulkIssue(merkleRoots, { nonce: await getSetNonce(signer) });
    } else {
      tx = await documentStore.issue(merkleRoots[0], { nonce: await getSetNonce(signer) });
    }
    console.log(tx);
    await tx.wait();
    for (const root of merkleRoots) {
      await updateMerkleRootByRoot(root);
    }
    console.log(
      `INFO ${moment().toISOString()} - Successfully issued roots: ${merkleRoots}`
    );
  } catch (err) {
    for (const root of merkleRoots) {
      const issued = await documentStore.isIssued(root);
      if (issued) {
        console.log("Issued root:", root);
        await updateMerkleRootByRoot(root);
      }
    }
    err.status = 500;
    err.code = "INTERNAL_SERVER_ERROR";
    throw err;
  } finally {
    await lockIssueState(false);
  }
}

const verifyDocWithContract = async (netId, addr, targetHash, merkleRoot) => {
  let network = getNetworkById(netId);
  const web3 = new Web3(new Web3.providers.HttpProvider(network.rpcUrl));
  const oaContract = new web3.eth.Contract(openattestationABI, addr);

  let result = "VALID";

  const issued = await oaContract.methods.isIssued("0x" + merkleRoot).call();
  if (!issued) {
    result = "INVALID";
  }

  const revoked = await oaContract.methods.isRevoked("0x" + merkleRoot).call();

  if (revoked) {
    result = "REVOKED";
  }

  if (targetHash !== merkleRoot) {
    const revoked = await oaContract.methods
      .isRevoked("0x" + targetHash)
      .call();
    if (revoked) {
      result = "REVOKED";
    }
  }

  return result;
};

const revokeWithContract = async (targetHashes) => {
  if (await getLockIssueState()) {
    return;
  }
  try {
    await lockIssueState(true);
    let signer = getSigner();
    const provider = getProvider();
    signer = signer.connect(provider);
    let hashes = targetHashes.map((root) =>
      root.slice(0, 2) === "0x" ? root : "0x" + root
    );
    let documentStore;
    documentStore = await docuStore.connect(process.env.DOCUMENT_STORE, signer);
    let tx;
    if (targetHashes.length === 1) {
      tx = await documentStore.revoke(hashes[0], { nonce: await getSetNonce(signer) });
    } else {
      tx = await documentStore.bulkRevoke(hashes, { nonce: await getSetNonce(signer) });
    }
    await tx.wait();

    for (const hash of targetHashes) {
      await updateRevokeDocument(hash);
    }
    console.log(
      `INFO ${moment().toISOString()} - Successfully revoke hashes: ${merkleRoots}`
    );
  } catch (err) {
    for (const hash of targetHashes) {
      const isRevoked = await documentStore.isRevoked(hash.slice(0, 2) === "0x" ? hash : "0x" + hash);
      if (isRevoked) {
        await updateRevokeDocument(hash);
      }
    }
    err.status = 500;
    err.code = "INTERNAL_SERVER_ERROR";
    throw err;
  } finally {
    await lockIssueState(false);
  }
};

const getSetNonce = async (signer) => {
  let lastestNonce = await signer.getNonce();
  // get latest Nonce.find base on create date
  let dbNonce = await nonceRespository.findOne().sort({ createdDate: -1 });
  if (dbNonce) {
    if (lastestNonce < dbNonce.nonce) {
      lastestNonce = dbNonce.nonce + 1;
    }
    // save dbnonce to db
    dbNonce.nonce = lastestNonce;
    await dbNonce.save();
  } else {
    dbNonce = await nonceRespository.create({ nonce: lastestNonce });
  }
  return dbNonce.nonce;
};

const lockIssueState = async (status) => {
  let lockStatus = await lockRespository.findOne().sort({ createdDate: -1 });
  if (lockStatus) {
    lockStatus.status = status;
    await lockStatus.save();
  } else {
    lockStatus = await lockRespository.create({ status: status });
  }
}
const getLockIssueState = async () => {
  let lockStatus = await lockRespository.findOne().sort({ createdDate: -1 });
  if (lockStatus) {
    return lockStatus.status;
  } else {
    await lockRespository.create({ status: false });
    return false;
  }
}

module.exports = {
  issueMerkleRoots,
  verifyDocWithContract,
  revokeWithContract,
  getSetNonce
};
