
var Test = require('../config/testConfig.js');
const { expect } = require("chai");
const {
  BN,           
  expectEvent,  
  balance,
  ether,
} = require('@openzeppelin/test-helpers');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  const ORACLE_START_IDX = 10;

  // Contract events
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    app = config.flightSuretyApp;
    data = config.flightSuretyData;
    flights = config.flights;
    oracles = config.oracles;
    MIN_ORACLE_RESPONSES = 3;

    airline1 = config.airline1;

    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    await app.registerAirline('Airline 1', config.airline1, {from: config.owner});
    await data.authorizeCaller(airline1, {from: config.owner});    
 });

  /****************************************************************************************/
  /* Oracles                                                                              */
  /****************************************************************************************/
  describe('Oracles', () => {
    it('can register oracles', async () => {

      // ARRANGE
      let fee = await app.REGISTRATION_FEE.call();

      // ACT
      for (let a = 0; a < TEST_ORACLES_COUNT; a++) {
        await app.registerOracle({ from: accounts[ORACLE_START_IDX + a], value: fee });
        let result = await app.getMyIndexes.call({ from: accounts[ORACLE_START_IDX + a] });
        console.log(`\tOracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
      }
    });

    it('can request flight status', async () => {

      // ARRANGE
      let flight = 'ND1309'; // Course number
      let timestamp = Math.floor(Date.now() / 1000);

      // Submit a request for oracles to get status information for a flight
      await app.fetchFlightStatus(airline1, flight, timestamp);
      // ACT

      // Since the Index assigned to each test account is opaque by design
      // loop through all the accounts and for each account, all its Indexes (indices?)
      // and submit a response. The contract will reject a submission if it was
      // not requested so while sub-optimal, it's a good test of that feature
      for (let a = 0; a < TEST_ORACLES_COUNT; a++) {

        // Get oracle information
        let oracleIndexes = await app.getMyIndexes.call({ from: accounts[ORACLE_START_IDX + a] });
        for (let idx = 0; idx < 3; idx++) {

          try {
            // Submit a response...it will only be accepted if there is an Index match
            await app.submitOracleResponse(oracleIndexes[idx], airline1, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[ORACLE_START_IDX + a] });
          }
          catch (e) {
            // Enable this when debugging
            //console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
          }
        }
      }
    });

    it('If flight is delayed due to airline fault, insured passenger receive credit 1.5X the amount they paid', async () => {
      let flight = flights[0];
      let airline = flight[0];      // First airline
      let flightName = flight[1];
      let departureTime = flight[2];


      let passenger = accounts[6];
      let fundPrice = web3.utils.toWei("10", "ether");
      let insuranceAmount = web3.utils.toWei("1", "ether");

      // Check: airline should be registered and not funded
      let isAirlineRegistered = await app.isAirlineRegistered.call(airline);
      assert.equal(isAirlineRegistered, true, 'Airline should be registered');
      let isAirlineFunded = await app.isAirlineFunded.call(airline);
      assert.equal(isAirlineFunded, false, 'Airline should not be funded');

      // fund airline
      await app.fundAirline({ from: airline, value: fundPrice });
      isAirlineFunded = await app.isAirlineFunded.call(airline);
      assert.equal(isAirlineFunded, true, 'Airline should be funded');

      // Register flight
      await app.registerFlight(flightName, departureTime, { from: airline });
      let isFlightRegistered = await app.isFlightRegistered.call(airline, flightName, departureTime);
      assert.equal(isFlightRegistered, true, 'Flight is not registered');

      // passenger buys insurance for 1 ether
      await app.buyInsurance(airline, flightName, departureTime, { from: passenger, value: insuranceAmount });
      let amount = await app.getPremium(airline, flightName, departureTime, { from: passenger });
      assert.equal(amount, insuranceAmount, 'Passenger could not pay insurance');

      // Submit a request for oracles to get status information for a flight
      expectEvent(
        await app.fetchFlightStatus(airline, flightName, departureTime, {
          from: passenger,
        }),
        "OracleRequest",
        {
          airline: airline,
          flight: flightName,
          departureTime: departureTime,
        }
      );

     let reportedFlightStatus = STATUS_CODE_LATE_AIRLINE;
     let responses = 0;

     let promises = Promise.all(
       oracles.map(async (oracleAccount) => {
         expect(await app.isOracleRegistered.call(oracleAccount)).to.be.true;

         let oracleIndexes = await app.getMyIndexes.call({
           from: oracleAccount,
         });
         expect(oracleIndexes).to.have.lengthOf(3);

         for (let i = 0; i < 3; i++) {
           try {
             await app.submitOracleResponse(
               oracleIndexes[i],
               airline,
               flightName,
               departureTime,
               reportedFlightStatus,
               { from: oracleAccount }
             );
             responses++;
           } catch (e) {
           }
         }
       })
      );
      await promises;
      expect(responses).to.be.gte(MIN_ORACLE_RESPONSES);
      
      let isInsurancePaidOut = await app.isInsurancePaidOut(airline, flightName, departureTime, { from: passenger });
      assert.equal(isInsurancePaidOut, true, "Insurance should be paid out due to airline delay");

      let actualCredit = await app.getPayOutAmount(airline, flightName, departureTime, { from: passenger });
      const expectedCredit = (web3.utils.toBN(insuranceAmount)).mul(new BN(3)).div(new BN(2));
      console.log(`\tPassenger actual credit: ${actualCredit.toString()}. Passenger expected credit: ${expectedCredit.toString()}.`)
      assert.equal(actualCredit.eq(expectedCredit), true, `Credit to passenger is ${actualCredit.toString()} instead of ${expectedCredit.toString()}.`);
    });

    it("Passenger can withdraw insurance refund", async () => {
      let passenger = accounts[6];

      let passengerBalance = await app.getBalance({ from: passenger });
      expect(passengerBalance).to.be.bignumber.equal(ether("1.5"));

      let tracker = await balance.tracker(passenger); 

      expectEvent(
        await app.withdrawRefund({ from: passenger }),
        "RefundWithdrawal",
        {
          passenger: passenger,
        }
      );
      expect(await tracker.delta()).to.be.bignumber.gte(ether('1.499'));  //minus gas fees
    });
  });
});
