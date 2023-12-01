# Open Attestation with CamDL

To perform document or data attestation using the Open Attestation framework, two essential components are required: the Document Registry (Smart Contract) and the Attestation Service.

## Document Store (Smart Contract)

To begin Open Attestation CLI is required to be installed. The library can be install via command below

`npm install -g open-attestation-cli-camdl`

To be noted, this library above is a forked version of open attestation with the included support with CamDL networks. [Link to repository](https://github.com/sereyvathanatum/open-attestation-cli-camdl)

### Wallet Creation

Before publishing the smart contract to the blockchain network, a wallet is requires. A wallet contains private key which is used to submit transaction or interact with a blockchain network.

To create a wallet type command below and input your wallet password

` open-attestation-camdl wallet create --of ./wallet.json`

- For mainnet CamDL only, Wallet is required to perform eKYC before submit transaction to the network. Visit [https://kyc.camdl.gov.kh](https://kyc.camdl.gov.kh) to proceed eKYC.

After wallet is created, make sure your address has compute credit (CamDL token) to proceed further. Token can be redeemed via available faucets, or contact admin for compute credit request

- [Mainnet](https://faucet.camdl.gov.kh/)
- [Staging](https://faucet.staging.camdl.gov.kh)

### Smart Contract creation

Smart contract of open attestation can be viewed [here](https://github.com/Open-Attestation/document-store). However, smart contract use with open attestation can be deployed with command below with prompt of your password created on previous step

` open-attestation-camdl deploy document-store "My Document" --network camdl-staging --encrypted-wallet-path /path/to/wallet.json`

- Mainnet: camdl
- Staging: camdl-staging

After the smart contract is created please note down the contract address which will later be used in the next step

### DNS TXT update

Organization can attest the ownership of the smart contract by modifying thier DNS TXT record on their DNS setting.
eg:

` TXT   ekycis-demo.svathana.com    "openatts net=ethereum netId=295 addr=0xcdf4822C3028EcDF82277F617cbb4f7f7d5932B0"`

- Mainnet NetId: 95
- Staging NetID: 295

## Attestation Service

Attestation service requires database to temporary store attestation request for batch wrapping purpose. Batch wrapping purpose is created to reduced the amount of transaction submit to the blockchain network by combind multiple documents together and produce one final merkle root.

### MongoDb

Attestation service uses mongodb as its database. Docker compose and Dockerfile can be found within this repository.
MongoDb is requires to operate as replica set (oplog enabled). To configure MongoDb as replica set:

#### Generate Key file

Key file can be generated with command

` openssl rand -base64 741 >> ./mongo/keyfile`

#### MongoDb Service

edit the environment variable within docker-compose-mongo.yaml file and ./mongo/rs-initiate.js, then docker compose up

` docker-compose -f docker-compose-mongo.yaml up -d`

After the service is up, connect to the container instance via terminal and confirm user and database creation, replica set initialization (sample ./mongo/rs-initiate.js)

### Attestation Service

edit the environment variable within docker-compose.yaml file

` docker-compose up -d`

use postman collection and modify endpoint to your service to start issuing and verify attestation
