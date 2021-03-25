const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = async (deployer, network, accounts) => {

    let contractOwner = accounts[0];
    let firstAirline = accounts[1];

    console.log(`Contract Owner: ${contractOwner}`);
    console.log(`First Airline Account: ${firstAirline}`);

    await deployer.deploy(FlightSuretyData, {from: contractOwner});
    let data = await FlightSuretyData.deployed();

    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address, {from: contractOwner});
    let app = await FlightSuretyApp.deployed();
    
    await data.authorizeCaller(FlightSuretyApp.address, {from: contractOwner});

    await app.registerAirline('First Airline', firstAirline, {from: contractOwner});
    await data.authorizeCaller(firstAirline, {from: contractOwner});

    console.log(`contractOwner: ${contractOwner}`);
    console.log(`Data address: ${data.address}`);
    console.log(`App address: ${app.address}`);
    console.log(`First airline address: ${firstAirline}`);
    
    let config = {
        localhost: {
            url: 'http://localhost:8545',
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address,
            network: network,
            accounts: accounts
        }
    }

    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
}
