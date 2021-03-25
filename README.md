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
    ![flightSurety test](/screens/truffle-flightSurety-test.png)
    ```
    truffle test ./test/oracles.js
    ```
    ![flightSurety test](/screens/truffle-oracles-test.png)


## DApp Deployment

1. **Run Ganache CLI**

   Stop and run Ganache CLI again with the following parameters: 
    ```
    ganache-cli -m "seed words" --accounts=50 --gasLimit=0x1fffffffffffff --allowUnlimitedContractSize
    ```

2. **Deploy Contracts**
    ```
    truffle migrate --reset --network development
    ```


## Launching FlightSurety DApp

1. **Run Ganache CLI**
    
    If not already running, run Ganache CLI again:

    ```
    ganache-cli -m "seed words" --accounts=50 --deterministic --gasLimit 500000000 --gasPrice 30000000000
    ```

2. **Import Accounts**

    Import contract owner, airline and passengers accounts from Ganache to Metamask using private keys.
Here is how to import accounts to Metamask:

    |# | Account  | Default| Metamask|
    |-- | ---- | --------- | --------|
    |1  |owner | |   |
    |2  |airline | 5 airline accounts| import|
    |3  |airline | ||
    |4  |airline |  ||
    |5  |airline |   ||
    |6  |airline |||
    |7  |passenger | 3 passenger accounts|import|
    |8  |passenger | ||
    |9  |passenger | ||
    |10 |oracle | 40 oracles | don't import|
    |.. |.. | .. |..|
    |50 |oracle |  ||
    
    Airline and passenger default numbers of accounts are defined and can be changed in master_data.js: **NUMBER_OF_AIRLINES** and **NUMBER_OF_PASSENGERS** constants).
    
    Oracle accounts will not be imported to Metamask. The number of oracle accounts is defined and can be changed in server.js: **NUMBER_OF_ORACLES**.


3. **Start the Server**
    
    Wait until the 40 oracles have been registered before starting the DApp
    ```
    npm run server
    ```

4. **Start the DApp**
    ```
    npm run dapp
    ```

5. Go to http://localhost:8000



## Resources

* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)