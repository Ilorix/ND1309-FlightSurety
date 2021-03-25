var Test = require('../config/testConfig.js');
const assert = require("chai").assert;
const {
    expectEvent  // Assertions for emitted events
} = require('@openzeppelin/test-helpers');


contract('Flight Surety Tests', async (accounts) => {
    var config;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        data = config.flightSuretyData;
        app = config.flightSuretyApp;
        // Airlines
        airline1 = config.airline1;
        airline2 = config.airline2;
        airline3 = config.airline3;
        airline4 = config.airline4;
        airline5 = config.airline5;
        // Flights
        flights = config.flights;
        // Passengers
        passengers = config.passengers;

        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
        await app.registerAirline('Airline 1', config.airline1, {from: config.owner});
        await data.authorizeCaller(airline1, {from: config.owner});
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/
    describe('Operations and Settings', () => {    

        it(`(multiparty) has correct initial isOperational() value`, async function () {

            // Get operating status
            let status = await data.isOperational.call();
            assert.equal(status, true, "Incorrect initial operating status value");

        });

        it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

            // Ensure that access is denied for non-Contract Owner account
            let accessDenied = false;
            try {
                await data.setOperatingStatus(false, { from: config.testAddresses[2] });
            }
            catch (e) {
                accessDenied = true;
            }
            assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

        });

        it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

            // Ensure that access is allowed for Contract Owner account
            let accessDenied = false;
            try {
                await data.setOperatingStatus(false);
            }
            catch (e) {
                accessDenied = true;
            }
            assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

        });

        it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
            let newAirline = accounts[2];
            let fundPrice = web3.utils.toWei("10", "ether");

            await data.setOperatingStatus(false);

            let reverted = false;
            try {
                await app.fundAirline({ from: newAirline, value: fundPrice });
            }
            catch (e) {
                reverted = true;
            }
            assert.equal(reverted, true, "Access not blocked for requireIsOperational");

            // Set it back for next tests to work
            await data.setOperatingStatus(true, {from: config.owner});

        });
    });    

    /****************************************************************************************/
    /* Airlines                                                                             */
    /****************************************************************************************/
    describe('Airlines', () => {

        it('(airline) cannot register another Airline using registerAirline() if it is not funded', async () => {
            // ARRANGE
            let newAirline = accounts[2];

            // ACT
            try {
                await app.registerAirline("New Airline", newAirline, { from: airline1 });
            }
            catch (e) {

            }
            let result = await data.isAirlineRegistered.call(newAirline);

            // ASSERT
            assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
        });
          
        it('Only existing airline may register a new airline until there are at least four airlines registered', async function () {
            let fundPrice = web3.utils.toWei("10", "ether");

            await app.fundAirline({ from: airline1, value: fundPrice });
            let isAirline1Funded = await data.isAirlineFunded(airline1);
            assert.equal(isAirline1Funded, true, "Airline1 couldn't be funded");

            await app.registerAirline("Airline 2", airline2, { from: airline1 });
            await app.registerAirline("Airline 3", airline3, { from: airline1 });
            await app.registerAirline("Airline 4", airline4, { from: airline1 });
            await app.registerAirline("Airline 5", airline5, { from: airline1 });

            isAirline2Registered = await data.isAirlineRegistered(airline2);
            isAirline3Registered = await data.isAirlineRegistered(airline3);
            isAirline4Registered = await data.isAirlineRegistered(airline4);
            isAirline5Registered = await data.isAirlineRegistered(airline5);

            assert.equal(isAirline2Registered, true, "An existing airline may register new airlines until there are at least 4 registered airlines");
            assert.equal(isAirline3Registered, true, "An existing airline may register new airlines until there are at least 4 registered airlines");
            assert.equal(isAirline4Registered, true, "An existing airline can't register new airlines if there are at least 4 registered airlines");
            assert.equal(isAirline5Registered, false, "An existing airline can't register new airlines if there are at least 4 registered airlines");
        });

        it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async function () {
            let numberOfRegisteredAirlines = await data.getRegisteredAirlineCount.call();

            let fundPrice = web3.utils.toWei("10", "ether");
            await app.fundAirline({ from: airline2, value: fundPrice });
            await app.fundAirline({ from: airline3, value: fundPrice });
            await app.fundAirline({ from: airline4, value: fundPrice });

            let isAirline2Funded = await data.isAirlineFunded(airline2);
            let isAirline3Funded = await data.isAirlineFunded(airline3);
            let isAirline4Funded = await data.isAirlineFunded(airline4);

            assert.equal(isAirline2Funded, true, "Airline 2 couldn't be funded");
            assert.equal(isAirline3Funded, true, "Airline 3 couldn't be funded");
            assert.equal(isAirline4Funded, true, "Airline 4 couldn't be funded");

            let registeringAirlines = [airline1, airline2, airline3, airline4];
            let isAirline5Registered = await data.isAirlineRegistered(airline5);
            assert.equal(isAirline5Registered, false, "Airline 5 should not be registered");

            let i=0;
            while (!isAirline5Registered){                
                await app.registerAirline("Airline 5", airline5, { from: registeringAirlines[i] });
                isAirline5Registered = await data.isAirlineRegistered(airline5);
                i++;
            }
            let votes = await app.getVotes(airline5);
            numberOfRegisteredAirlines = await data.getRegisteredAirlineCount.call();
            assert.equal(isAirline5Registered, true, "Airline 5 should be registered");
            assert.equal(numberOfRegisteredAirlines, 5, "multi-party consensus failed");
            assert.equal(votes, 2, "2 votes are required for registering airline 5");
        });   

        it('Airline can register a flight', async () => {
            // Fund fifth airline 
            let fundPrice = web3.utils.toWei("10", "ether");
            await app.fundAirline({ from: airline5, value: fundPrice });    
            isAirline5Funded = await data.isAirlineFunded(airline5);

            assert.equal(isAirline5Funded, true, "Airline 5 couldn't be funded");

            // Register 5 flights by 5 airlines
            for (i=0; i < flights.length; i++){
                let airline = flights[i][0];
                let flightName = flights[i][1];
                let departureTime = flights[i][2];

                let tx = await app.registerFlight(flightName, departureTime, {from: airline});

                let registrationStatus = await app.isFlightRegistered.call(airline, flightName, departureTime);
                console.log(`\tFlight ${flightName} at ${departureTime} has been registered by ${airline}`);
                assert.equal(registrationStatus, true, "Flight couldn't be registered");
            }
        });
    });        
        
   
    /****************************************************************************************/
    /* Passengers                                                                           */
    /****************************************************************************************/
    describe('Passengers', () => {
      
        it('Passengers can purchase flight insurance for up to 1 ether', async () => {
          let insuranceAmount = web3.utils.toWei("1", "ether");
  
          passengers.forEach(async (passenger, index) => {
            let flight = flights[index];
            let airline = flight[0];
            let flightName = flight[1];
            let departureTime = flight[2];
    
            let tx = await app.buyInsurance(airline, flightName, departureTime, {from: passenger, value: insuranceAmount});
            expectEvent(tx, 'InsurancePurchased', {
              passenger: passenger,
              amount: insuranceAmount
            });
          });
        });
    });
});
