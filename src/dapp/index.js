import './flightsurety.css';
import DOM from './dom';
import Contract from './contract';
import UI from './ui';
import MasterData from './master_data';

import Web3 from 'web3';
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';

/*
*  FlightSurety DApp
*
*  This component encapsulates all UI event listeners.
*/
document.addEventListener('DOMContentLoaded', () => {
    DApp.init();
});    

const DApp = {
    web3: null,
    contracts: {},
    accounts: [],

    init: function () {
        return DApp.initWeb3();
    },

    initWeb3: async function () {
        if (typeof window.ethereum !== 'undefined') {
            // New web3 provider
            // As per EIP1102 and EIP1193
            // Ref: https://eips.ethereum.org/EIPS/eip-1102
            // Ref: https://eips.ethereum.org/EIPS/eip-1193
            try {
                // Request account access if needed
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                });
                // Accounts are exposed now
                DApp.updateAccounts(accounts);

                // Opt out of refresh page on network change
                // Ref: https://docs.metamask.io/guide/ethereum-provider.html#properties
                ethereum.autoRefreshOnNetworkChange = true;
            } catch (error) {
                // User denied account access
                console.error('User denied web3 access');
                return;
            }
            DApp.provider = window.ethereum;
            DApp.web3 = new Web3(window.ethereum);
        }
        else if (window.web3) {
            // Deprecated web3 provider
            DApp.web3 = new Web3(web3.currentProvider);
        }
        // No web3 provider
        else {
            console.error('No web3 provider detected');
            return;
        }
        return DApp.initContract();
    },

    updateAccounts: async function (accounts) {
        const firstUpdate = !(DApp.accounts && DApp.accounts[0]);
        DApp.accounts = accounts || await DApp.web3.eth.getAccounts();
        console.log('updateAccounts', accounts[0]);
    },

    initContract: async function () {
        
       let networkId = await DApp.web3.eth.net.getId();
       console.log('networkId', networkId);
   
       let deployedNetwork = FlightSuretyApp.networks[networkId];
       
       if (!deployedNetwork) {
         console.error('No contract deployed on the network that you are connected. Please switch networks.');
         return;
       }
       console.log('deployedNetwork', deployedNetwork);

        let contract = new Contract('localhost', DApp.provider);
        let ui = new UI(DApp.web3);
        return DApp.render(DApp, contract, ui);
    },

    render: async function (DApp, contract, ui) {

        var data = new MasterData();
        
        var accounts = null;
        var isUpdatingAirlines = false;
        var isUpdatingFlights = false;
        var isUpdatingInsurances = false;

        // Tab areas control
        var statusArea = DOM.elid("status-area");
        var airlinesTable = DOM.elid("airlines-status-table");
        var flightsTable = DOM.elid("flights-status-table");
        var insurancesTable = DOM.elid("insurances-status-table");
        statusArea.style.display = "none";
        airlinesTable.style.display = "none";
        flightsTable.style.display = "none";
        insurancesTable.style.display = "none";

        contract.getAirlineAccounts().then(function (result) {
            accounts = result;
        });

        // Initialize Tabs
        let navs = ["admin-tab", "airlines-tab", "flights-tab", "insurances-tab"].map(item => {
            return DOM.elid(item);
        });
        let formContainers = ["contract-resource-forms", "airlines-resource-forms", "flights-resource-forms", "insurances-resource-forms"].map(item => {
            return DOM.elid(item);
        });
        let displayWrapper = DOM.elid("display-wrapper");
        navs.forEach((navItem, index, arr) => {
            navItem.addEventListener('click', () => {
                arr.forEach((item, idx, array) => {
                    item.classList.remove("active");
                    formContainers[idx].style.display = "none";
                });
                navItem.classList.add("active");
                formContainers[index].style.display = "block";
                displayWrapper.innerHTML = "";
            });
        });

        ui.setStatus(contract);
        let homePage = DOM.elid("contract-resource-forms");
        homePage.style.display = 'block';

        DOM.elid("admin-tab").addEventListener('click', async () => {
            statusArea.style.display = "none";
            airlinesTable.style.display = "none";
            flightsTable.style.display = "none";
            insurancesTable.style.display = "none";
            ui.setStatus(contract);
        });

        DOM.elid("airlines-tab").addEventListener('click', async () => {
            var operating = true;
            contract.isOperational().then(function (status) {
                if (!status) {
                    operating = false;
                    ui.showErrorMessage("Contract is currently not operational.");
                    $('#airlines-resource-forms :input').prop("disabled", true);
                } else {
                    $('#airlines-resource-forms :input').prop("disabled", false);
                }
            });
            if (operating) {
                if (isUpdatingAirlines) {
                    DOM.elid("airlines-tab").style.pointerEvents = 'auto';
                    return;
                }
                isUpdatingAirlines = true;

                statusArea.style.display = "block";
                airlinesTable.style.display = "block";
                flightsTable.style.display = "none";
                insurancesTable.style.display = "none";

                contract.isContractAuthorized().then(function (isContractAuthorized) {
                    if (isContractAuthorized) {
                        // Airlines Table
                        let airlinesTableRows = DOM.elid("airlines-status-table-rows");
                        contract.getAirlineAccounts().then(function (accounts) {
                            ui.populateAirlinesData(data, contract, accounts);
                            ui.updateAirlinesTable(contract, accounts, airlinesTableRows);
                        });
                    }
                }).then(function () {
                    DOM.elid("airlines-tab").style.pointerEvents = 'auto';
                    isUpdatingAirlines = false;
                });
            }
        });

        DOM.elid("flights-tab").addEventListener('click', async () => {
            var operating = true;
            contract.isOperational().then(function (status) {
                if (!status) {
                    operating = false;
                    ui.showErrorMessage("Contract is currently not operational.");
                    $('#flights-resource-forms :input').prop("disabled", true);
                } else {
                    $('#flights-resource-forms :input').prop("disabled", false);
                }
            });
            if (operating) {
                if (isUpdatingFlights) {
                    DOM.elid("flights-tab").style.pointerEvents = 'auto';
                    return;
                }
                isUpdatingFlights = true;
                statusArea.style.display = "block";
                flightsTable.style.display = "block";
                airlinesTable.style.display = "none";
                insurancesTable.style.display = "none";

                var metamask_account = await ui.getMetamaskAccounts(function(result) {
                    return result;
                });

                contract.isContractAuthorized().then(function (isContractAuthorized) {
                    if (isContractAuthorized) {
                        ui.getFundedAirlines(contract, accounts, "flights-airline-address").then(function (names) {
                                let flights = data.getFlights(names[0]);
                                let airline = DOM.elid("flights-airline-address").value;
                                ui.populateNonRegisteredFlights(contract, airline, flights, "flights-no-departure");
                        })
                        var flightsTableRows = DOM.elid("flights-status-table-rows");
                        ui.updateFlightsTable(ui, contract, flightsTableRows);
                    }
                }).then(function () {
                    DOM.elid("flights-tab").style.pointerEvents = 'auto';
                    isUpdatingFlights = false;
                });
            }
        });

        DOM.elid("insurances-tab").addEventListener('click', async () => {
            var operating = true;
            contract.isOperational().then(function (status) {
                if (!status) {
                    operating = false;
                    ui.showErrorMessage("Contract is currently not operational.");
                    $('#insurances-resource-forms :input').prop("disabled", true);
                } else {
                    $('#insurances-resource-forms :input').prop("disabled", false);
                }
            });
            if (operating) {
                if (isUpdatingInsurances) {
                    DOM.elid("insurances-tab").style.pointerEvents = 'auto';
                    return;
                }
                isUpdatingInsurances = true;
                statusArea.style.display = "block";
                insurancesTable.style.display = "block";
                airlinesTable.style.display = "none";
                flightsTable.style.display = "none";
                let insurancesTableRows = DOM.elid("insurances-status-table-rows");

                var dropDownList1 = DOM.elid("insurance-select-flight");
                var dropDownList2 = DOM.elid("insurance-passenger-address");
                var dropDownList3 = DOM.elid("insurance-withdraw-passenger-address");

                contract.isContractAuthorized().then(function (isContractAuthorized) {
                    if (isContractAuthorized) {
                        // Flight list
                        ui.populateRegisteredFlights(contract, dropDownList1);
                        // Create passenger lists
                        contract.getPassengerAccounts().then(function (accounts) {
                            ui.createPassengerList(accounts, dropDownList2, 'Select passenger');
                            ui.createPassengerList(accounts, dropDownList3, 'Select passenger');
                            DOM.elid("insurance-passenger-balance").value = 0; 
                        });
                        ui.updateInsurancesTable(contract, insurancesTableRows);
                    }
                }).then(function () {
                    DOM.elid("insurances-tab").style.pointerEvents = 'auto';
                    isUpdatingInsurances = false;
                });
            }
        });


        DOM.elid("authorize-contract").addEventListener('click', async () => {
            contract.getAccounts().then(function (accounts) {
                let contractOwner = accounts[0];
                ui.getMetamaskAccounts(function(metamask_account) {
                    if (metamask_account != contractOwner) {
                        ui.showErrorMessage(`Contract owner must be connected and selected in Metamask.`);
                        return;
                    }                    
                });
            });

            contract.isContractAuthorized().then(function (isContractAuthorized) {
                if (!isContractAuthorized) {
                    try {
                        contract.authorizeCaller().then(function () {
                            let authorized = DOM.elid("authorized-status");
                            let notAuthorized = DOM.elid("not-authorized-status");
                            notAuthorized.style.display = "none";
                            authorized.style.display = "inline-block";
                            ui.showSuccessMessage("Contract has been authorized");
                        });
                    } catch (e) {
                        console.log(e);
                        ui.showErrorMessage(JSON.stringify(e, null, '\t'));                
                    } 
                } else {
                    ui.showErrorMessage('Contract is already authorized.');
                }
            });
        });

        DOM.elid("deauthorize-contract").addEventListener('click', async () => {
            contract.getAccounts().then(function (accounts) {
                let contractOwner = accounts[0];
                ui.getMetamaskAccounts(function(metamask_account) {
                    if (metamask_account != contractOwner) {
                        ui.showErrorMessage(`Contract owner must be connected and selected in Metamask.`);
                        return;
                    }                    
                });
            });
            contract.isContractAuthorized().then(function (isContractAuthorized) { 
                if (isContractAuthorized){
                    try {
                        contract.deauthorizeCaller().then(function () {
                            let authorized = DOM.elid("authorized-status");
                            let notAuthorized = DOM.elid("not-authorized-status");
                            notAuthorized.style.display = "inline-block";
                            authorized.style.display = "none";
                            ui.showSuccessMessage('Contract has been deauthorized');
                        });
                    } catch (e) {
                        console.log(e);
                        ui.showErrorMessage(JSON.stringify(e, null, '\t'));                     
                    }
                }else{
                    ui.showErrorMessage('Contract is already deauthorized.');
                }
            });
        });

        DOM.elid("operation-turn-on").addEventListener('click', async () => {
            contract.getAccounts().then(function (accounts) {
                let contractOwner = accounts[0];
                ui.getMetamaskAccounts(function(metamask_account) {
                    if (metamask_account != contractOwner) {
                        ui.showErrorMessage(`Contract owner must be connected and selected in Metamask.`);
                        return;
                    }                    
                });
            });
            contract.isOperational().then(function (isOperational) { 
                if (!isOperational){
                    let request = {
                        mode: true
                    };
                    try {
                        contract.setOperatingStatus(request).then(function () {
                            let operating = DOM.elid("operating-status");
                            let nonOperating = DOM.elid("non-operating-status");
                            nonOperating.style.display = "none";
                            operating.style.display = "inline-block";
                            ui.showSuccessMessage('Operation has been turned on');                     
                        });
                    } catch (e) {
                        console.log(e);
                        ui.showErrorMessage(JSON.stringify(e, null, '\t'));   
                    }
                }else{
                    ui.showErrorMessage('Contract is already operational.');  
                }
            });    
        });        

        DOM.elid("operation-turn-off").addEventListener('click', async () => {
            contract.getAccounts().then(function (accounts) {
                let contractOwner = accounts[0];
                ui.getMetamaskAccounts(function(metamask_account) {
                    if (metamask_account != contractOwner) {
                        ui.showErrorMessage(`Contract owner must be connected and selected in Metamask.`);
                        return;
                    }                    
                });
            });
            contract.isOperational().then(function (isOperational) { 
                if (isOperational){
                    let request = {
                        mode: false
                    };
                    try {
                        contract.setOperatingStatus(request).then(function () {
                            let operating = DOM.elid("operating-status");
                            let nonOperating = DOM.elid("non-operating-status");
                            nonOperating.style.display = "inline-block";
                            operating.style.display = "none";
                            ui.showSuccessMessage('Operation has been turned off');                    
                        });
                    } catch (e) {
                        console.log(e);
                        ui.showErrorMessage(JSON.stringify(e, null, '\t'));                  
                    }
                }else{
                    ui.showErrorMessage('Contract is already non-operational.');  
                }
            });    
        });

  
        DOM.elid("register-airline").addEventListener('click', async () => {
            let airlineAddress = DOM.elid("airlines-airline-address");
            let byAirlineAddress = DOM.elid("airlines-register-by-airline-address");
            let name = DOM.elid("airlines-airline-name");

            let request = {
                airline: airlineAddress.value,
                name: name.value,
                from: byAirlineAddress.value
            };

            let metamask_account = await ui.getMetamaskAccounts(function(result) {
                return result;
            });
            if (metamask_account != byAirlineAddress.value) {
                ui.showErrorMessage("Account of registering airline must be connected and selected in Metamask.");
                return;
            }

            try {
                contract.registerAirline(request).then(function () {
                    contract.isAirlineRegistered(request.airline).then(function (isRegistered) {
                        if (isRegistered) {
                            contract.getAirlineAccounts().then(function (accounts) {
                                let airlinesTableRows = DOM.elid("airlines-status-table-rows");
                                ui.populateAirlinesData(data, contract, accounts);
                                ui.updateAirlinesTable(contract, accounts, airlinesTableRows);
                                ui.showSuccessMessage(`${name.value} has been registered`);                    
                            });
                        }else{
                            contract.getRequiredVotes().then(function (votes) {
                                ui.showErrorMessage(`Airline could not be registered. Registration requires at least ${votes} votes from all other registered airlines.`);
                            });
                        }                
                    });    
                });
            } catch (e) {
                console.log(e);
                ui.showErrorMessage(JSON.stringify(e, null, '\t'));
            } 
        });

        DOM.elid("fund-airline").addEventListener('click', async () => {
            let airlineAddress = DOM.elid("funding-registered-airlines");
            try {
                let metamask_account = await ui.getMetamaskAccounts(function(result) {
                    return result;
                });
                if (metamask_account != airlineAddress.value) {
                    ui.showErrorMessage("Account of airline to fund must be connected and selected in Metamask.");
                    return;
                }
                let request = {
                    from: airlineAddress.value
                };
                let name = await contract.getAirlineName(airlineAddress.value);
                await contract.fundAirline(request);
                
                contract.getAirlineAccounts().then(function (accounts) {
                    let airlinesTableRows = DOM.elid("airlines-status-table-rows");    
                    ui.populateAirlinesData(data, contract, accounts);
                    ui.updateAirlinesTable(contract, accounts, airlinesTableRows);
                    ui.showSuccessMessage(`${name} has been funded`);   
                });
            } catch (e) {
                console.log(e);
                ui.showErrorMessage(JSON.stringify(e, null, '\t'));
            } 
        });

        DOM.elid("register-flight").addEventListener('click', async () => {
            let airline =  DOM.elid("flights-airline-address").value;
            let flightNoDeparture =  DOM.elid("flights-no-departure").value;
            let flight, departure;
            let flightInfo = flightNoDeparture.split(';');
            flight = flightInfo[0];
            departure = flightInfo[1];

            let metamask_account = await ui.getMetamaskAccounts(function(result) {
                return result;
            });
            if (metamask_account != airline) {
                ui.showErrorMessage(`Airline account ${airline} must be connected and selected in Metamask.`);
                return;
            }            

            var request = {
                airline: airline,
                flight: flight,
                departure: departure
            };

            let isFunded = await contract.isAirlineFunded(request.airline);
            if (!isFunded) {
                ui.showErrorMessage("Airline is not funded.");
                return;
            }

            try {
                await contract.registerFlight(request);
                var flightsTableRows = DOM.elid("flights-status-table-rows");
                ui.updateFlightsTable(ui, contract, flightsTableRows);
                ui.getFundedAirlines(contract, accounts, "flights-airline-address").then(function (names) {
                    let flights = data.getFlights(names[0]);
                    let airline = DOM.elid("flights-airline-address").value;
                    ui.populateNonRegisteredFlights(contract, airline, flights, "flights-no-departure");
                });                
                ui.showSuccessMessage(`${flight} flight  has been registered`);
            } catch (e) {
                console.log(e);
                ui.showErrorMessage(JSON.stringify(e, null, '\t'));
            } 
        });


        DOM.elid("flights-airline-address").addEventListener('change', async () => {
            let airlineAddress = DOM.elid("flights-airline-address").value;
            let name = await contract.getAirlineName(airlineAddress);
            let flights = data.getFlights(name);
            let airline = DOM.elid("flights-airline-address").value;
            ui.populateNonRegisteredFlights(contract, airline, flights, "flights-no-departure");            
        });

        DOM.elid("insurance-passenger-address").addEventListener('change', async () => {
            let passengerAddress = DOM.elid("insurance-passenger-address");
            if (passengerAddress.value == 'none') {
                $('#insurances-buy-form :input').prop("disabled", true);                
                $('#insurance-select-flight').prop("disabled", false);
                $('#insurance-passenger-address').prop("disabled", false);
                $('#buy-insurance-payment-amount').prop("disabled", false);
            } else {
                $('#insurances-buy-form :input').prop("disabled", false); 
            }         
            let passengerAddressToWithdraw = DOM.elid("insurance-withdraw-passenger-address");            
            let passengerBalance = DOM.elid("insurance-passenger-balance").value;                      
            if (passengerAddressToWithdraw.value == 'none' || passengerBalance == 0) {
                $('#withdraw-insurance-amount').prop("disabled", true);
            } else {                
                $('#withdraw-insurance-amount').prop("disabled", false);
            }                
        });

        DOM.elid("insurance-withdraw-passenger-address").addEventListener('change', async () => {
            let passengerAddressToWithdraw = DOM.elid("insurance-withdraw-passenger-address").value;            
            let passengerBalance = DOM.elid("insurance-passenger-balance").value;                      
            if (passengerAddressToWithdraw == 'none') {         
                DOM.elid("insurance-passenger-balance").value = 0;       
                $('#insurances-withdraw-form :input').prop("disabled", true);
                $('#insurance-withdraw-passenger-address').prop("disabled", false);
            } else {
                let request = {
                    address: passengerAddressToWithdraw
                };
                contract.getBalance(request).then(function (balance) {
                    if (balance == 0) {                
                        $('#insurances-withdraw-form :input').prop("disabled", true);
                        $('#insurance-withdraw-passenger-address').prop("disabled", false);
                        $('#insurance-passenger-balance').val(0);
                    }else{
                        $('#insurances-withdraw-form :input').prop("disabled", false);
                        $('#insurance-passenger-balance').val(balance);
                        $('#insurance-passenger-balance').prop("disabled", true);
                    }    
                });                
                $('#insurances-withdraw-form :input').prop("disabled", false);
            }       
        });

        DOM.elid("buy-insurance").addEventListener('click', async () => {
            let flight = DOM.elid("insurance-select-flight").value;
            let passenger = DOM.elid("insurance-passenger-address").value;
            let paymentAmount = DOM.elid("buy-insurance-payment-amount").value;
            let request = {
                flight: flight,
                paymentAmount: paymentAmount,
                from: passenger
            };

            let metamask_account = await ui.getMetamaskAccounts(function(result) {
                return result;
            });
            if (metamask_account != passenger) {
                ui.showErrorMessage(`Passenger account ${passenger} must be connected and selected in Metamask.`);
                return;
            }
            if (request.from == 'none' && request.paymentAmount == '') {
                ui.showErrorMessage("Please select a passenger and enter premium amount up to one ether.");
                return;
            }
            if (request.from == 'none') {
                ui.showErrorMessage("Please select a passenger.");
                return;
            }
            if (request.paymentAmount == '' || 
                request.paymentAmount <= 0 || 
                request.paymentAmount > 1) {
                ui.showErrorMessage("Please enter premium amount up to one ether.");
                return;
            }

            try {
                await contract.buyInsurance(request);
                let insurancesTableRows = DOM.elid("insurances-status-table-rows");
                ui.updateInsurancesTable(contract, insurancesTableRows);
                ui.showSuccessMessage("Insurance has been bought");
            } catch (e) {
                console.log(e);
                ui.showErrorMessage(JSON.stringify(e, null, '\t'));
            } 
        });

        DOM.elid('withdraw-insurance-amount').addEventListener('click', async () => {
            let passengerAddress = DOM.elid('insurance-withdraw-passenger-address').value;
            let request = {
                address: passengerAddress
            };

            let metamask_account = await ui.getMetamaskAccounts(function(result) {
                return result;
            });
            if (metamask_account != passengerAddress) {
                ui.showErrorMessage(`Passenger account ${passengerAddress} must be connected and selected in Metamask.`);
                return;
            }            
            contract.getBalance(request).then(function (balance) {
                let request = {
                    address: passengerAddress,
                    from: passengerAddress
                };
                var currentBalance = balance;
                if (request.address != 'none') {
                    try {
                        contract.withdrawRefund(request).then(function (balance) {
                            ui.showSuccessMessage(`Insurance payment of ${currentBalance} Wei has been withdrawn.`);
                            let insurancesTableRows = DOM.elid("insurances-status-table-rows");
                            ui.updateInsurancesTable(contract, insurancesTableRows);

                            let passengerAddressToWithdraw = DOM.elid("insurance-withdraw-passenger-address").value;            
                            if (passengerAddressToWithdraw == 'none') {                
                                $('#insurances-withdraw-form :input').prop("disabled", true);
                                $('#insurance-withdraw-passenger-address').prop("disabled", false);
                            } else {
                                let request = {
                                    address: passengerAddressToWithdraw
                                };
                                contract.getBalance(request).then(function (balance) {
                                    if (balance == 0) {                
                                        $('#insurances-withdraw-form :input').prop("disabled", true);
                                        $('#insurance-withdraw-passenger-address').prop("disabled", false);
                                        $('#insurance-passenger-balance').val(0);
                                    }else{
                                        $('#insurances-withdraw-form :input').prop("disabled", false);
                                        $('#insurance-passenger-balance').val(balance);
                                        $('#insurance-passenger-balance').prop("disabled", true);
                                    }    
                                });                
                                $('#insurances-withdraw-form :input').prop("disabled", false);
                            }       

                        });
                    } catch (e) {
                        console.log(e);
                        ui.showErrorMessage(JSON.stringify(e, null, '\t'));
                    } 
                }
            });
        });
    },
};

