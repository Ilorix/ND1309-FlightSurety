
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];

    let flightSuretyData = await FlightSuretyData.new();
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    let TEST_ORACLES_COUNT = 20;

    let owner = accounts[0];  // Contract owner account
    let airline1 = accounts[1];
    let airline2 = accounts[2];
    let airline3 = accounts[3];
    let airline4 = accounts[4];
    let airline5 = accounts[5];

    let flights = [
        [airline1, 'OS 075', new Date(2021, 2, 27, 18, 30, 0).valueOf().toString()],
        [airline2, 'UPS 275', new Date(2021, 2, 28, 22, 0, 0).valueOf().toString()],
        [airline3, 'TK 1888', new Date(2021, 3, 10, 10, 0, 0).valueOf().toString()],
        [airline4, 'EW 7751', new Date(2021, 3, 12, 19, 0, 0).valueOf().toString()],
        [airline5, 'LX 1583', new Date(2021, 3, 14, 20, 0, 0).valueOf().toString()],
    ];

    passengers = accounts.slice(6,9);
    oracles = accounts.slice(10, 10+TEST_ORACLES_COUNT);
   
    return {
        owner: owner,
        airline1,
        airline2,
        airline3,
        airline4,
        airline5,
        flights: flights,
        passengers: passengers,
        oracles: oracles,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp,
        weiMultiple: (new BigNumber(10)).pow(18)
    }
}

module.exports = {
    Config: Config
};