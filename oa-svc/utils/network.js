const networks = [
  {
    netId: 1,
    network: "ethereum",
    rpcUrl: "https://eth.llamarpc.com",
  },
  {
    netId: 137,
    network: "polygon",
    rpcUrl: "https://polygon.llamarpc.com",
  },
  {
    netId: 95,
    network: "camdl",
    rpcUrl: "https://rpc1.camdl.gov.kh",
  },
  {
    netId: 195,
    network: "camdl-testnet",
    rpcUrl: "https://rpc1.testnet.camdl.gov.kh",
  },
  {
    netId: 295,
    network: "camdl-staging",
    rpcUrl: "https://rpc1.staging.camdl.gov.kh",
  },
];

const getNetworkById = (netId) => {
  for (let i = 0; i < networks.length; i++) {
    if (networks[i].netId == parseInt(netId)) {
      return networks[i];
    }
  }
  const msg = `Incorrect network id netId=${netId}`;
  const err = new Error(msg);
  err.status = 400;
  err.code = "BAD_REQUEST";
  err.message = msg;
  throw err;
};

module.exports = getNetworkById;
