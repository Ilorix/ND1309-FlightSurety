# FlightSurety

Udacity Blockchain Developer Nanodegree project Flight Surety.


## Installation

To install, download or clone this repo, then run:

`npm install`


## DApp Building

Compile contracts (FlightSuretyApp and FlightSuretyData contracts):
```
truffle compile
```

Run Ganache CLI:
```
ganache-cli -m "seed words" --accounts=50 --deterministic --gasLimit 500000000 --gasPrice 30000000000
```

Deploy contracts:
```
truffle migrate --reset --network development
```



## DApp Testing

First, run Ganache CLI:
```
ganache-cli --accounts=50 --gasLimit 500000000 --gasPrice 30000000000
```

Then, run these two truffle tests separately:
```
`truffle test ./test/flightSurety.js`

`truffle test ./test/oracles.js`
```
To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)