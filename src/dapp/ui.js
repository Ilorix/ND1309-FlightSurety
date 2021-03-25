import DOM from './dom';
import './flightsurety.css';

/*
*  
*  This class encapsulates all UI action handlers.
*/

export default class UI {

    constructor (web3) {
        this.web3 = web3;
    }

    getMetamaskAccounts(callback) {
        return this.web3.eth.getAccounts((error,result) => {
            if (error) {
                console.log(error);
                return error;
            } else {
                return callback(result);
            }
        });
    }

    async setStatus(contract) {
        contract.isContractAuthorized().then(function (status) {
            let authorized = DOM.elid("authorized-status");
            let notAuthorized = DOM.elid("not-authorized-status");
            if (status) {
                notAuthorized.style.display = "none";
                authorized.style.display = "inline-block";
            } else {
                notAuthorized.style.display = "inline-block";
                authorized.style.display = "none";
            }
        });

        contract.isOperational().then(function (status) {
            let operating = DOM.elid("operating-status");
            let nonOperating = DOM.elid("non-operating-status");
            if (status) {
                nonOperating.style.display = "none";
                operating.style.display = "inline-block";
            } else {
                nonOperating.style.display = "inline-block";
                operating.style.display = "none";
            }
        });
    }

    async populateAirlinesData(data, contract, accounts) {
        // Filter non-registered airlines
        this.getNonRegisteredAirlines(data, contract, accounts, "airlines-airline-address");

        // Filter funded and registered airlines
        this.getFundedAirlines(contract, accounts, "airlines-register-by-airline-address");
               
        // Filter non-funded airlines
        this.getNonFundedAirlines(contract, accounts, "funding-registered-airlines");

        //this.populateAirlineNames(data, "airlines-airline-name");
    }

    async populateAirlineNames(airlineNames, dropDownListID) {
        let dropDownList = DOM.elid(dropDownListID);
        this.clearDropdownList(dropDownList);
        for (var i=0; i < airlineNames.length; i++) {
            let el = document.createElement("option");
            el.text = `${airlineNames[i]}`;
            el.value = `${airlineNames[i]}`;
            dropDownList.appendChild(el);
        }
    }    

    async populateNonRegisteredFlights(contract, airline, flights, dropDownListID) {
        let dropDownList = DOM.elid(dropDownListID);
        this.clearDropdownList(dropDownList);
        for (var i=0; i<flights.length; i++) {
            var flight = flights[i][1];
            var timestamp = flights[i][2];
            var request = {
                airline: airline,
                flight: flight,
                departure: timestamp,
                from: airline
            };
            let isFlightRegistered = await contract.isFlightRegistered(request);
            if (!isFlightRegistered){
                var date = new Date(parseInt(request.departure));
                const departureTimeAsString = date.getDate()+
                          "/"+(date.getMonth()+1)+
                          "/"+date.getFullYear()+
                          " "+date.getHours()+
                          ":"+date.getMinutes()+
                          ":"+date.getSeconds();
                let el = document.createElement("option");
                el.text = `${flights[i][1]} - ${departureTimeAsString}`;
                el.value = `${flights[i][1]};${timestamp}`;
                dropDownList.appendChild(el);            
            }
        }
    }

    async getNonRegisteredAirlines(data, contract, accounts, dropDownListID) {
        let dropDownList = DOM.elid(dropDownListID);
        this.clearDropdownList(dropDownList);
        let airlineCount = 0;

        for (var i = 1; i < accounts.length; i++) {
            let isRegistered = await contract.isAirlineRegistered(accounts[i]);
            if (!isRegistered && !this.optionIsAvailable(dropDownList, accounts[i])) {
                let el = document.createElement("option");
                el.text = `${accounts[i]}`;
                el.value = `${accounts[i]}`;
                dropDownList.appendChild(el);
                airlineCount++;
            }
        }
        if (airlineCount > 0){
            let airlineNames = data.getAirlineNames();
            let nonRegisteredNames = [];
            for (var i=0; i < airlineNames.length; i++) {
                let isNameRegistered = await contract.isAirlineNameRegistered(airlineNames[i]);
                if (!isNameRegistered){
                    nonRegisteredNames.push(airlineNames[i]);
                }
            }    
            this.populateAirlineNames(nonRegisteredNames, "airlines-airline-name");
        }
    }

    async getNonFundedAirlines(contract, accounts, dropDownListID) {
        let nonFundedCount = 0;
        let dropDownList = DOM.elid(dropDownListID);
        this.clearDropdownList(dropDownList);
        for (var i=1; i < accounts.length; i++) {
            let isRegistered = await contract.isAirlineRegistered(accounts[i]);
            let isFunded = await contract.isAirlineFunded(accounts[i]);
            if (isRegistered && !isFunded) {
                nonFundedCount += 1;
            }    
            if (isRegistered && !isFunded && !this.optionIsAvailable(dropDownList, accounts[i])) {
                let el = document.createElement("option");
                let airlineName = await contract.getAirlineName(accounts[i]);
                el.text = `${airlineName}  (${accounts[i]})`;
                el.value = `${accounts[i]}`;
                dropDownList.appendChild(el);
            }
        }
        if (nonFundedCount == 0){
            $('#funding-form :input').prop("disabled", true);
        }else{
            $('#funding-form :input').prop("disabled", false);
        }
    }

    async getFundedAirlines(contract, accounts, dropDownListID) {
        let fundedCount = 0;
        let dropDownList = DOM.elid(dropDownListID);
        let airlineNames = [];
        this.clearDropdownList(dropDownList);

        for (var i=1; i < accounts.length; i++) {
            let isRegistered = await contract.isAirlineRegistered(accounts[i]);
            let airlineName = await contract.getAirlineName(accounts[i]);
            let isFunded = await contract.isAirlineFunded(accounts[i]);
            if (isFunded) {
                airlineNames.push(airlineName);
                fundedCount += 1;
            }    
            if (isRegistered && isFunded && !this.optionIsAvailable(dropDownList, accounts[i])) {
                let el = document.createElement("option");
                let airlineName = await contract.getAirlineName(accounts[i]);
                el.text = `${airlineName}  (${accounts[i]})`;
                el.value = `${accounts[i]}`;
                dropDownList.appendChild(el);
            }
        }
        if (fundedCount == 0){
            $('#airlines-registration-form :input').prop("disabled", true);
        }else{
            $('#airlines-registration-form :input').prop("disabled", false);
        }
        return airlineNames;
    }

    async createPassengerList(accounts, dropDownList, firstOptionText) {
        this.clearDropdownList(dropDownList); 
        if (firstOptionText == '') {
            for (var i = 0; i < accounts.length; i++) {
                var el = document.createElement("option");
                el.text = `${accounts[i]}`;
                el.value = `${accounts[i]}`;
                dropDownList.appendChild(el);
            }
        } else {
            var el;
            for (var i = 0; i < accounts.length + 1; i++) {
                if (i == 0) {
                    el = document.createElement("option");
                    el.text = firstOptionText;
                    el.value = 'none';
                } else {
                    el = document.createElement("option");
                    el.text = `${accounts[i - 1]}`;
                    el.value = `${accounts[i - 1]}`;
                }
                dropDownList.appendChild(el);
            }
        }
    }

    async populateRegisteredFlights(contract, dropDownList) {
        this.clearDropdownList(dropDownList); 
        let keys = await contract.getFlightKeys();
        for (var i = 0; i < keys.length; i++) {
            let request = {
                flightKey: keys[i]
            };
            let flight = await contract.getFlight(request);
            let airline = flight.airline;
            let airlineName = await contract.getAirlineName(airline);
            let flightNumber = flight.flight;
            let timestamp = flight.departureTime;
            const milliseconds = timestamp * 1000
            const dateObject = new Date(milliseconds)
            const departureTimeAsString = dateObject.toLocaleString()

            var el = document.createElement("option");
            el.text = `${flightNumber} - ${airlineName} - Departure: ${departureTimeAsString}`;
            el.value = `${keys[i]}`;
            dropDownList.appendChild(el);
        }
    }

    async updateFlightStatus(ui, contract, badgeID, key) {
        let request = {
            flightKey: key
        };

        contract.getFlight(request).then(function (flight) {
            let airline = flight.airline;
            let flightNo = flight.flight;
            let departureTime = flight.departureTime;
            
            request = {
                airline: airline,
                flight: flightNo,
                departure: departureTime,
                from: airline
            };
            
            ui.getMetamaskAccounts(function(metamaskAccount) {
                if (metamaskAccount != airline) {
                    ui.showErrorMessage(`Account ${airline} must be connected and selected in Metamask.`);
                    return;
                }                
            });
           
            contract.fetchFlightStatus(request).then(function (status) {
                request = {
                    flightKey: key
                };

                $(badgeID).removeClass();
                $(badgeID).text('fetching..');
                contract.IsFlightDelayed(request).then(function (flightDelayed) {
                    setTimeout(function () {
                        $(badgeID).addClass('badge');
                        $(badgeID).addClass('rounded-pill');                
                        if (flightDelayed) {
                            $(badgeID).addClass('bg-danger');
                            $(badgeID).addClass('text-white');
                            $(badgeID).text('(20) Delay/airline');                        
                        }else{
                            $(badgeID).addClass('bg-success');
                            $(badgeID).addClass('text-white');
                            $(badgeID).text('No Delay');                        
                        }    
                        }, 1000);
                });    
            });
        }); 
    }

    async updateAirlinesTable(contract, accounts, rows) {
        var td1, td2, td3, td4;
        var value1, value2, value3, value4;
        var tr;
        while (rows.hasChildNodes()) {
            rows.removeChild(rows.firstChild);
        }
        for (var i=1; i < accounts.length; i++) {
            let isRegistered = await contract.isAirlineRegistered(accounts[i]);
            let isFunded = await contract.isAirlineFunded(accounts[i]);
            tr = document.createElement('tr');

            let name = await contract.getAirlineName(accounts[i]);
            td1 = document.createElement('td');
            value1 = document.createTextNode(`${name}`);
            td1.appendChild(value1);

            td2 = document.createElement('td');
            value2 = document.createTextNode(`${accounts[i]}`);
            td2.appendChild(value2);

            if (isRegistered == true) {
                let votes = await contract.getVotes(accounts[i]);
                td3 = document.createElement('td');
                td3.classList.add('text-success');
                td3.classList.add('font-weight-bold');
                td3.classList.add('text-center');
                if (votes > 1){
                    td3.innerHTML = `<span>&#10003;&nbsp;</span><span class="font-weight-normal">(${votes} votes)</span>`;
                }else{
                    td3.innerHTML = `<span>&#10003;&nbsp;</span>`;
                }
                if (isFunded == true) {
                    td4 = document.createElement('td');
                    td4.classList.add('text-success');
                    td4.classList.add('font-weight-bold');
                    td4.classList.add('text-center');
                    td4.innerHTML = '<span>&#10003;</span>';
                } else {
                    td4 = document.createElement('td');
                    td4.classList.add('text-center');
                    value4 = document.createTextNode(' ');
                    td4.appendChild(value4);
                }
                tr.appendChild(td1);
                tr.appendChild(td2);
                tr.appendChild(td3);
                tr.appendChild(td4);
                rows.appendChild(tr);
            }    
        }

        let airlineAddress = DOM.elid("airlines-airline-address").value;
        let registerByairlineAddress = DOM.elid("airlines-register-by-airline-address").value;
        if (airlineAddress.length == 0 || registerByairlineAddress.length == 0) {
            $('#airlines-registration-form :input').prop("disabled", true);
        } else {
            $('#airlines-registration-form :input').prop("disabled", false);
        }     
    }

    async updateFlightsTable(ui, contract, rows) {
        var td1, td2, td3, td4, td5;
        var value;
        var tr;
        var statusValue;

        while (rows.hasChildNodes()) {
            rows.removeChild(rows.firstChild);
        }

        let keys = await contract.getFlightKeys();
        for (var i=0; i < keys.length; i++) {
            let request = {
                flightKey: keys[i]
            };
            let flight = await contract.getFlight(request);    
            let airline = flight.airline;
            let airlineName = await contract.getAirlineName(airline);
            let flightNumber = flight.flight;
            let timestamp = flight.departureTime;

            var date = new Date(parseInt(timestamp));
            const departureTimeAsString = date.getDate()+
                    "/"+(date.getMonth()+1)+
                    "/"+date.getFullYear()+
                    " "+date.getHours()+
                    ":"+date.getMinutes()+
                    ":"+date.getSeconds();

            tr = document.createElement('tr');
            td1 = document.createElement('td');
            td1.innerHTML = '<span>&#9992; </span>' + `${flightNumber}`;

            td2 = document.createElement('td');
            value = document.createTextNode(`${airlineName}  (${airline})`);
            td2.appendChild(value);

            td3 = document.createElement('td');
            value = document.createTextNode(`${departureTimeAsString}`);
            td3.appendChild(value);

            td4 = document.createElement('td');
            td4.classList.add('text-center');

            let statusBadge = document.createElement('span');
            statusBadge.id = `flight${i}`;  
            statusBadge.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp';
            td4.appendChild(statusBadge);

            let btn = document.createElement('button');
            btn.classList.add('btn');
            btn.classList.add('btn-primary');
            btn.classList.add('btn-sm');
            btn.id = 'request-flight-status-btn' + `${i}`;
            btn.value = `#flight${i};;${keys[i]}`;
            btn.innerText = 'Request Status';
            td5 = document.createElement('td');
            td5.style.display = 'block';
            td5.style.margin = 'auto';
            td5.style.vertical_align = 'middle';
            td5.appendChild(btn);

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            tr.appendChild(td5);
            rows.appendChild(tr);

            $(document).off('click', `#request-flight-status-btn${i}`);
            $(document).on('click', `#request-flight-status-btn${i}`, function () {
                let flightId = this.value.split(';;');
                let flightIndex = flightId[0];
                let flightKey = flightId[1];
                ui.updateFlightStatus(ui, contract, flightIndex, flightKey);
            });
        }
    }

    async updateInsurancesTable(contract, rows) {
        var td1, td2, td3, td4, td5;
        var value;
        var tr;
        while (rows.hasChildNodes()) {
            rows.removeChild(rows.firstChild);
        }
        var keys = await contract.getFlightKeys();

        for (var i=0; i < keys.length; i++) {
            let request = {
                flightKey: keys[i]
            };
            let flight = await contract.getFlight(request);
            let airline = flight.airline;
            let airlineName = await contract.getAirlineName(airline);
            let flightNumber = flight.flight;
            let timestamp = flight.departureTime;

            var date = new Date(parseInt(timestamp));
            const departureTimeAsString = date.getDate()+
                      "/"+(date.getMonth()+1)+
                      "/"+date.getFullYear()+
                      " "+date.getHours()+
                      ":"+date.getMinutes()+
                      ":"+date.getSeconds();            

            let flightInfo = `${flightNumber} ${airlineName} (Departure: ${departureTimeAsString})`;
            let passengers = await contract.getInsurees(request);
            for (var p = 0; p < passengers.length; p++) {
                tr = document.createElement('tr');
                td1 = document.createElement('td');
                td1.classList.add('table-info');
                td1.colSpan = "4";
                td1.innerHTML = '<span>&#9992; </span>' + `${flightInfo}`;
                rows.appendChild(td1);
                rows.appendChild(tr);

                let request = {
                    flightKey: keys[i],
                    passenger: passengers[p]
                };
                let premium = await contract.getPremium(request);
                let payOutAmount = await contract.getPayOutAmount(request);

                tr = document.createElement('tr');
                td2 = document.createElement('td');
                td2.style.width = "1%";
                value = document.createTextNode('');
                td2.appendChild(value);

                td3 = document.createElement('td');
                td3.style.width = "45%";
                let span = document.createElement('span');
                if (payOutAmount > 0){
                    span.innerHTML = `&#9785;&nbsp;${passengers[p]}`;
                }else{
                    span.innerHTML = `&#9786;&nbsp;${passengers[p]}`;
                }
                td3.appendChild(span);
                td4 = document.createElement('td');
                td4.style.width = "27%";
                value = document.createTextNode(`${premium}`);
                td4.appendChild(value);

                td5 = document.createElement('td');
                td4.style.width = "27%";
                value = document.createTextNode(`${payOutAmount}`);
                td5.appendChild(value);

                tr.appendChild(td2);
                tr.appendChild(td3);
                tr.appendChild(td4);
                tr.appendChild(td5);
                rows.appendChild(tr);
            }
        }

        let passengerAddress = DOM.elid("insurance-passenger-address");
        if (passengerAddress.value == 'none') {
            $('#insurances-buy-form :input').prop("disabled", true);                
            $('#insurance-select-flight').prop("disabled", false);
            $('#insurance-passenger-address').prop("disabled", false);
            $('#buy-insurance-payment-amount').prop("disabled", false);
        } else {
            $('#buy-insurance-payment-amount').prop("disabled", false);
        }         
        let passengerAddressToWithdraw = DOM.elid("insurance-withdraw-passenger-address").value;            
        let passengerBalance = DOM.elid("insurance-passenger-balance").value;            
        if (passengerAddressToWithdraw == 'none' || passengerBalance == 0) {
            $('#insurances-withdraw-form :input').prop("disabled", true);
            $('#insurance-withdraw-passenger-address').prop("disabled", false);  
        } else {                
            $('#insurances-buy-form :input').prop("disabled", false);
        }                
    }

    optionIsAvailable(dropDownList, value) {
        if (dropDownList == null) {
            return false;
        }
        for (var i = 0; i < dropDownList.length; i++) {
            if (String(dropDownList.options[i].value) == String(value)) {
                return true;
            }
        }
        return false;
    }

    clearDropdownList(selectList) {
        if (selectList == null) {
            return;
        }
        while (selectList.hasChildNodes()) {
            selectList.removeChild(selectList.firstChild);
        }
        if (selectList.options != null) {
            var length = selectList.options.length;
            if (length > 0) {
                for (var i = length - 1; i >= 0; i--) {
                    selectList.options[i] = null;
                }
            }
        }
    }

    showSuccessMessage(message) {
        $('#success-message').html('<p>&#10003;&nbsp;' + String(message) + '</p>');
        $("#success-message-area").modal('show');
        setTimeout(function () {
            $('#success-message-area').modal('hide').modal('dispose');
        }, 5000);
    }

    showErrorMessage(message) {
        $('#error-message').html('<p><i class="bi bi-x-circle-fill"></i>&nbsp;&nbsp;' + String(message) + '</p>');
        $("#error-message-area").modal('show');
        setTimeout(function () {
            $('#error-message-area').modal('hide').modal('dispose');
        }, 5000);
    }
}
