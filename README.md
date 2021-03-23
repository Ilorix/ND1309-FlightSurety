# FlightSurety

Udacity Blockchain Developer Nanodegree project Flight Surety.


## Installation

To install, download or clone this repo, then run:

`npm install`


## DApp Build and Deployment

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

1. Run Ganache CLI:
```
ganache-cli --accounts=50 --gasLimit 500000000 --gasPrice 30000000000
```

2. Run flightSurety and oracles truffle tests (separately):
```
truffle test ./test/flightSurety.js

truffle test ./test/oracles.js
```

## Launching FlightSurety DApp

1. Import contract owner, airline and passengers accounts from Ganache to Metamask using private keys.
Here is how imported accounts are used in DApp and Metamask:

    |# | Account  | Default| 
    |-- | ---- | --------- |
    |1  |owner | |   
    |2  |airline | 5 airline accounts  |
    |3  |airline | |
    |4  |airline |  |
    |5  |airline |   |
    |6  |airline ||
    |7  |passenger | 3 passenger accounts|
    |8  |passenger | |
    |9  |passenger | |
    |10 |oracle | 40 oracles |
    |.. |.. |  |
    |50 |oracle |  |


Airline and passenger default numbers of accounts are defined and can be changed in master_data.js: **NUMBER_OF_AIRLINES** and **NUMBER_OF_PASSENGERS** constants).
Default number of oracle accounts is defined and can be changed in server.js: **NUMBER_OF_ORACLES**.
<br>


2. Run Ganache CLI:
```
ganache-cli -m "seed words" --accounts=50 --deterministic --gasLimit 500000000 --gasPrice 30000000000
```
3. Start the server and wait until oracles have been registered before starting the DApp:
```
npm run server
```

4. Start the DApp:
```
npm run dapp
```
Go to http://localhost:8000



## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)