# FlightSurety

Udacity Blockchain Developer Nanodegree project Flight Surety.

### Libraries
Library      | Version
------------ | -------------
Node             |v14.15.3
Solidity         |v0.5.16
openzeppelin-solidity |v2.1.2
Truffle          |v5.1.63
truffle-hdwallet-provider |v1.0.17
truffle-assertions   |v0.9.2
@truffle/contract | 4.3.9
web3             |v1.3.3

### Testing libraries
Library      | Version
------------ | -------------
truffle-assertions             |v0.9.2
Chai         |v4.2.0


## Installation

To install, download or clone this repo, then run:

`npm install`


## DApp Development and Testing

1. **Compile contracts**
    ```
    truffle compile
    ```

2. **Run Ganache CLI**
    
    Run Ganache CLI with the following parameters:
    ```
    ganache-cli --accounts=50 --gasLimit=0x1fffffffffffff --allowUnlimitedContractSize
    ```

3. **Run Truffle Tests**:
    ```
    truffle test ./test/flightSurety.js
    ````
    ![flightSurety test](/screens/tests/truffle-flightSurety-test.png)
    ```
    truffle test ./test/oracles.js
    ```
    ![flightSurety test](/screens/tests/truffle-oracles-test.png)


## DApp Deployment

1. **Run Ganache CLI**

   Stop and run Ganache CLI again with the following parameters: 
    ```
    ganache-cli -m "seed words" --accounts=50 --deterministic --gasLimit=0x1fffffffffffff --allowUnlimitedContractSize
    ```

2. **Deploy Contracts**
    ```
    truffle migrate --reset --network development
    ```


## Launching FlightSurety DApp

1. **Import Accounts**

    Import contract owner, airline and passengers accounts from Ganache to Metamask using private keys. The following table shows the accounts to be imported to Metamask:

    |# | Account  | Default| Metamask|
    |-- | ---- | --------- | --------|
    |1  |owner | |   |
    |2  |airline | 5 airline accounts| import|
    |3  |airline | |import|
    |4  |airline |  |import|
    |5  |airline |   |import|
    |6  |airline ||import|
    |7  |passenger | 3 passenger accounts|import|
    |8  |passenger | |import|
    |9  |passenger | |import|
    |10 |oracle | 40 oracles | don't import|
    |.. |.. | .. |..|
    |50 |oracle |  ||
    


2. **Start the Server**
    
    Wait until the 40 oracles have been registered before starting the DApp
    ```
    npm run server
    ```

3. **Start the DApp**
    ```
    npm run dapp
    ```

    Open http://localhost:8000 in browser.



## Resources

* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)