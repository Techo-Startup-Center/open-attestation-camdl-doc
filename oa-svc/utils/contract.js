const { Wallet, JsonRpcProvider } = require("ethers");
const Web3 = require("web3");
const getNetworkById = require("./network");
const openattestationABI = require("./abi");
const docuStore = require("@govtechsg/document-store");
const fs = require("fs");
const dotenv = require("dotenv");
const { updateMerkleRootByRoot, updateRevokeDocument } = require("./mongo");
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

  let merkleRoots = roots.map((root) =>
    root.slice(0, 2) === "0x" ? root : "0x" + root
  );
  let signer = getSigner();
  const provider = getProvider();
  signer = signer.connect(provider);
  let documentStore;
  try {
    documentStore = await docuStore.connect(process.env.DOCUMENT_STORE, signer);
    let tx;
    if (roots.length > 1) {
      tx = await documentStore.bulkIssue(merkleRoots);
    } else {
      tx = await documentStore.issue(merkleRoots[0]);
    }
    await tx.wait();
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
  let signer = getSigner();
  const provider = getProvider();
  signer = signer.connect(provider);
  let hashes = targetHashes.map((root) =>
    root.slice(0, 2) === "0x" ? root : "0x" + root
  );
  let documentStore;
  try {
    documentStore = await docuStore.connect(process.env.DOCUMENT_STORE, signer);
    let tx;
    if (targetHashes.length === 1) {
      tx = await documentStore.revoke(hashes[0]);
    } else {
      tx = await documentStore.bulkRevoke(hashes);
    }
    await tx.wait();
    
    for(const hash of targetHashes) {
      await updateRevokeDocument(hash);
    }
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
  }
};

module.exports = {
  issueMerkleRoots,
  verifyDocWithContract,
  revokeWithContract,
};
