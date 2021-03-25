/*
*
*  This class encapsulates all master data, getters and setters.
*/
const NUMBER_OF_AITLINES = 5;
const NUMBER_OF_PASSENGERS = 3;

export default class MasterData {    

    constructor () {
        this.airlines = null;
        this.flights = null;
        this.numberOfAirlines = 5;
        this.numberOfPassengers = 3;
        this.init();
    }

    static get numberOfAirlines() {
        return NUMBER_OF_AITLINES;
    }
    
    static get numberOfPassengers() {
        return NUMBER_OF_PASSENGERS;
    }

    init() {
        this.airlines = [
            ['Austrian Airlines'], 
            ['China Airlines'],
            ['Emirates'],
            ['First Airline'],
            ['United Airlines']
        ];

        this.flights = [
            ['Austrian Airlines', 'OS 075', new Date(2021, 4, 28, 10, 0, 0).valueOf().toString()],
            ['Austrian Airlines', 'OS 273', new Date(2021, 5, 11, 12, 0, 0).valueOf().toString()],
            ['Austrian Airlines', 'OS 474', new Date(2021, 6, 20, 15, 30, 0).valueOf().toString()],
            ['Austrian Airlines', 'OS 670', new Date(2021, 7, 9, 18, 0, 0).valueOf().toString()],
            ['Austrian Airlines', 'OS 975', new Date(2021, 8, 10, 21, 30, 0).valueOf().toString()],
               
            ['China Airlines', 'CI 075', new Date(2021, 4, 28, 10, 30, 0).valueOf().toString()],
            ['China Airlines', 'CI 415', new Date(2021, 5, 11, 12, 30, 0).valueOf().toString()],
            ['China Airlines', 'CI 534', new Date(2021, 6, 20, 15, 0, 0).valueOf().toString()],
            ['China Airlines', 'CI 675', new Date(2021, 7, 9, 18, 0, 0).valueOf().toString()],
            ['China Airlines', 'CI 925', new Date(2021, 8, 10, 21, 30, 0).valueOf().toString()],
      
            ['Emirates', 'EK 151', new Date(2021, 4, 28, 10, 15, 0).valueOf().toString()],
            ['Emirates', 'EK 242', new Date(2021, 5, 11, 12, 0, 0).valueOf().toString()],
            ['Emirates', 'EK 351', new Date(2021, 6, 20, 15, 30, 0).valueOf().toString()],
            ['Emirates', 'EK 562', new Date(2021, 7, 9, 18, 0, 0).valueOf().toString()],
            ['Emirates', 'EK 850', new Date(2021, 8, 10, 21, 0, 0).valueOf().toString()],
   
            ['First Airline', 'FA 188', new Date(2021, 4, 28, 10, 30, 0).valueOf().toString()],
            ['First Airline', 'FA 278', new Date(2021, 5, 11, 12, 0, 0).valueOf().toString()],
            ['First Airline', 'FA 558', new Date(2021, 6, 20, 15, 30, 0).valueOf().toString()],
            ['First Airline', 'FA 602', new Date(2021, 7, 9, 18, 0, 0).valueOf().toString()],
            ['First Airline', 'FA 901', new Date(2021, 8, 10, 21, 0, 0).valueOf().toString()],

            ['United Airlines', 'UA 175', new Date(2021, 4, 28, 10, 30, 0).valueOf().toString()],
            ['United Airlines', 'UA 275', new Date(2021, 5, 11, 12, 0, 0).valueOf().toString()],
            ['United Airlines', 'UA 375', new Date(2021, 6, 20, 15, 15, 0).valueOf().toString()],
            ['United Airlines', 'UA 875', new Date(2021, 7, 9, 18, 0, 0).valueOf().toString()],
            ['United Airlines', 'UA 975', new Date(2021, 8, 10, 21, 30, 0).valueOf().toString()]
        ];        
    }

    /*
    * Returns alirline name by index
    */ 
    getAirlineName(index) {
        for (let i=0; i < this.airlines.length; i++){
            if (i == index) {
                return this.airlines[i];
            }
        }
        return null;
    }

    /*
     * Returns all airline names
     */ 
    getAirlineNames() {
        let airlineNames = [];
        for (let i=0; i < this.airlines.length; i++){
            airlineNames.push(this.airlines[i][0]);
        }
        return airlineNames;
    }

    /* 
     * Returns all flights of an airline by name   
     */ 
    getFlights(airline) {
        let flights = [];
        for (let i=0; i<this.flights.length; i++){
            if (this.flights[i][0] == airline) {
               flights.push(this.flights[i]);
            }
        }
        return flights;
    }    
}

