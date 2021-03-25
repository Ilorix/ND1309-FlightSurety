import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


let oracles = [];
var FIRST_ORACLE_ADDRESS = 10, NUMBER_OF_ORACLES = 40;


web3.eth.getAccounts().then(accounts => {
  if (accounts.length < FIRST_ORACLE_ADDRESS + NUMBER_OF_ORACLES) {
    console.log('[Error]: there are not enough accounts to run oracles server.' + NUMBER_OF_ORACLES + ' accounts are needed.');
    return; 
  }

  // Initialize oracles addresses and indexes with smart contract
  var registeredOracleCount = 0;
  flightSuretyApp.methods.getOracleRegistrationFee().call({
    "from": accounts[0],
    "gas": 5000000,
    "gasPrice": 100000000000
  }).then(fee => {
    console.log('Smart Contract requires (' + fee + ') wei to fund oracle registration.');
    for (var i = FIRST_ORACLE_ADDRESS; i < FIRST_ORACLE_ADDRESS + NUMBER_OF_ORACLES; i++) {
      let account = accounts[i];
      oracles.push(account); 
      flightSuretyApp.methods.registerOracle().send({
        "from": account,
        "value": fee,
        "gas": 5000000,
        "gasPrice": 100000000000
      }).then(result => {
        registeredOracleCount += 1;
        console.log(`${registeredOracleCount}: ${account} registered`);
        if (registeredOracleCount == NUMBER_OF_ORACLES) {
           console.log(`\n${NUMBER_OF_ORACLES} oracles have been successfully registered and assigned addresses.`);
        }
      }).catch(err => {
        console.log('Could not create oracle at address: ' + account + '\n\tbecause: ' + err);
      })
    }

    console.log('Oracles server is up...\nOracles registered and assigned addresses...');
    console.log('Listening to a request event...');

    oracles.forEach(oracle => {
      flightSuretyApp.methods
        .getMyIndexes().call({
          "from": oracle,
          "gas": 5000000,
          "gasPrice": 100000000000
        }).then(result => {
          console.log('Assigned Indices: ' + result[0] + ', ' + result[1] + ', ' + result[2] + '\tfor oracle: ' + oracle);

        }).catch(error => {
          console.log('Could not retrieve oracle indices because: ' + error);
        })

    });

    console.log('Oracles server is up...');
    console.log('Listening to a request event...');

    // Listen for oracleRequest event
    flightSuretyApp.events.OracleRequest({ fromBlock: 0 },
      function (error, event) {
        if (error) console.log(error);
        console.log('Caught an event: ');
        let eventResult = event['returnValues'];
        console.log(eventResult);
        let index = eventResult['index'];
        let airline = eventResult['airline'];
        let flight = eventResult['flight'];
        let timestamp = eventResult['departureTime'];

        console.log('Only oracles with index ' + index + ' should respond to the request.');

        // Query the oracles with matching index for the flight status
        oracles.forEach(oracle => {
          flightSuretyApp.methods
            .getMyIndexes().call({
              "from": oracle,
              "gas": 5000000,
              "gasPrice": 100000000000
            }).then(result => {
              // Match oracle and respond with random status
              if (result[0] == index || result[1] == index || result[2] == index) 
              {
                // Generate a random status
                let flightStatus = Math.floor(Math.random() * 6) * 10;
                console.log('index=' + index + ' result[0]=' + result[0] + ' result[1]=' + result[1] + ' result[2]=' + result[2]);
                console.log('Random flight status: ' + flightStatus + ' from oracle: ' + oracle);
                //Reply back to smart contract with the determined status code
                flightSuretyApp.methods
                  .submitOracleResponse(index, airline, flight, timestamp, flightStatus).send({
                    "from": oracle,
                    "gas": 5000000,
                    "gasPrice": 100000000000
                  }).then(result => {
                    console.log('Oracle [' + oracle + '] response submitted successfully - Flight status: ' + flightStatus);
                  }).catch(error => {
                    console.log('Could not submit oracle response because: ' + error)
                  });
              }

            }).catch(error => {
              console.log('Could not retrieve oracle indices because: ' + error);
            })

        });
      });
  }).catch(err => { console.log('Could not retrieve registration fee. ' + err) });
});

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log(event)
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;


