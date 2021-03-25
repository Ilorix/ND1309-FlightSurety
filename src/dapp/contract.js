import MasterData from './master_data';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
const TruffleContract = require("@truffle/contract");

/*
*  Contract Access Layer
*
*  This class encapsulates all calls to backend operations.
*/
const NUMBER_OF_AITLINES = MasterData.NUMBER_OF_AITLINES;
const NUMBER_OF_PASSENGERS = MasterData.NUMBER_OF_PASSENGERS;

export default class Contract {
    constructor(network, provider) {
        this.config = Config[network];
        this.accounts = Config['localhost']['accounts'];

        this.web3 = new Web3(provider);

        this.flightSuretyApp = TruffleContract(FlightSuretyApp);
        this.flightSuretyApp.setProvider(provider);

        this.flightSuretyData = TruffleContract(FlightSuretyData);
        this.flightSuretyData.setProvider(provider);

        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.owner = this.accounts[0];

        let counter = 1;
        while(this.airlines.length < NUMBER_OF_AITLINES) {
            this.airlines.push(this.accounts[counter++]);
        }
        while(this.passengers.length < NUMBER_OF_PASSENGERS) {
            this.passengers.push(this.accounts[counter++]);
        }
    }

    /*------------------------------------------------------*/
    /*    Contract                                          */
    /*------------------------------------------------------*/    
    async getContractInstance(){
        return await this.flightSuretyApp.deployed(); 
    }

    async getDataContractInstance(){
        return await this.flightSuretyData.deployed(); 
    }

    async isContractAuthorized(){
        let data = await this.getDataContractInstance();
        return await data.isContractAuthorized(this.config.appAddress, {from: this.owner});       
    }

    async authorizeCaller() {   
        let data = await this.getDataContractInstance();
        await data.authorizeCaller(this.owner, {from: this.owner});
        return await data.authorizeCaller(this.config.appAddress, {from: this.owner});
    }

    async deauthorizeCaller() {
        let data = await this.getDataContractInstance();
        await data.deauthorizeCaller(this.owner, {from: this.owner});
        return await data.deauthorizeCaller(this.config.appAddress, {from: this.owner});
    }    

    async isOperational() {
        let instance = await this.getContractInstance();
        return await instance.isOperational({from: this.owner});
    }

    async setOperatingStatus(request) {
        let mode = request.mode;
        let instance = await this.getContractInstance();
        return await instance.setOperatingStatus(mode, {from: this.owner});
    }

    async getAccounts(){
        return this.accounts;
    }

    /*------------------------------------------------------*/
    /*    Airlines                                          */
    /*------------------------------------------------------*/    
    async getAirlineAccounts(){
        return this.accounts.slice(0, 6);
    }

    async isAirlineRegistered(airline){
        let instance = await this.getContractInstance();
        return await instance.isAirlineRegistered(airline);        
    }

    async isAirlineNameRegistered(airline){
        let instance = await this.getContractInstance();
        return await instance.isAirlineNameRegistered(airline);        
    }

    async isAirlineFunded(airline){
        let instance = await this.getContractInstance();
        return await instance.isAirlineFunded(airline);        
    }

    async fundAirline(request) {
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let fundPrice = this.web3.utils.toWei('10', "ether");
        return await instance.fundAirline({from: caller, value: fundPrice});
    }

    async registerAirline(request) {
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        return await instance.registerAirline(request.name, request.airline, {from: caller});
    }

    async getAirlineName(airline) {
        let instance = await this.getContractInstance();
        return await instance.getAirlineName(airline);
    }

    async getRequiredVotes() {
        let instance = await this.getContractInstance();
        return await instance.getRequiredVotes({from: this.owner});
    }

    async getVotes(airline) {
        let instance = await this.getContractInstance();
        return await instance.getVotes(airline, {from: this.owner});
    }

    /*------------------------------------------------------*/
    /*    Flights                                           */
    /*------------------------------------------------------*/ 
    async registerFlight(request){
        let instance = await this.getContractInstance();
        return await instance.registerFlight(request.flight, request.departure, {from: request.airline});
    }
   
    async fetchFlightStatus(request) {
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        await instance.fetchFlightStatus(request.airline, request.flight, request.departure, {from: caller});
    }

    async getFlights(airline){
        let instance = await this.getContractInstance();
        return await instance.getFlights(airline, {from: this.owner});
    }

    async getFlightKeys(){
        let instance = await this.getContractInstance();
        return await instance.getFlightKeys({from: this.owner});
    }

    async getFlight(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let result = await instance.getFlight(request.flightKey, {from: caller});
        return result;
    }

    async IsFlightDelayed(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        return await instance.IsFlightDelayed(request.flightKey, {from: caller});
    }

    async isFlightRegistered(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        return await instance.isFlightRegistered(request.airline, request.flight, request.departure, {from: caller});        
    }

    /*------------------------------------------------------*/
    /*    Insurance                                         */
    /*------------------------------------------------------*/    
    async getPassengerAccounts(){
        return this.accounts.slice(6, 9);
    }

    async buyInsurance(request){
        console.log(request);
        let caller = request.from || this.owner;
        let paymentAmount = this.web3.utils.toWei(request.paymentAmount.toString(), "ether");
        
        console.log(paymentAmount);

        let instance = await this.getContractInstance();

        let flight  = await instance.getFlight(request.flight, {from: caller});
        let airline = flight.airline;
        let flightNumber = flight.flight;
        let departureTime = flight.departureTime;

        await instance.buyInsurance(airline, flightNumber, departureTime, {from: caller, value: paymentAmount});
    }

    async getInsurees(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let result = await instance.getInsurees(request.flightKey, {from: caller});
        console.log(result);
        return result;
    }

    async getPremium(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let result = await instance.getPremium(request.flightKey, request.passenger, {from: caller});
        console.log(result);
        return result;
    }

    async getBalance(request){
        let instance = await this.getContractInstance();
        let result = await instance.getBalance({from: request.address});
        console.log(result);
        return result;
    }

    async getPayOutAmount(request){
        let caller = request.from || this.owner;
        let instance = await this.getContractInstance();
        let result = await instance.getPayOutAmount(request.flightKey, request.passenger, {from: caller});
        console.log(result);
        return result;
    }

    async withdrawRefund(request){
        let caller = request.from || request.address;
        let instance = await this.getContractInstance();
        return await instance.withdrawRefund({from: caller});
    }
}