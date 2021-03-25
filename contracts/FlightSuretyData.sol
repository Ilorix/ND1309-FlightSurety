pragma solidity ^0.5.16;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    struct Airline {
        string name;
        address airline;
        bool isRegistered;
        bool isFunded;
    }

    struct Flight {
        address airline;
        string flight;
        uint256 timestamp;
        bool isRegistered;
        uint8 statusCode;
    }

    struct FlightInsurance {
        mapping(address => uint256) insuranceAmount; // Purchased flight insurance amount per passenger (up to 1 ether)
        mapping(address => uint256) payOutAmount;    // Refunded amount per passenger
        address[] passengers;                        // All insured passengers in a flight
        bool isPaidOut;
    }

    mapping(address => bool) private authorizedCallers;
    mapping(address => Airline) private airlines;
    mapping(bytes32 => Flight) private flights;
    mapping(address => bytes32[]) private airlineFlights;
    mapping(bytes32 => FlightInsurance) private insurances; // Insurance per flight
    mapping(address => uint256) private insuranceRefunds; // Refunds per passenger
    
    address[] private registeredAirlines;           // Registered airline addresses
    string[]  private registeredAirlineNames;       // Registered airline names
    address[] private fundedAirlines;               // Funded airline addresses
    bytes32[] private flightKeys;                   // Keys of registered flights
    mapping(bytes32 => bool) private flightDelays;  // Flight delays per flight key 


    uint256 public constant AIRLINE_MIN_FUND = 10 ether; // minimum fund required to participate in contract

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AuthorizedContract(address authContract);
    event DeauthorizedContract(address authContract);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() public {
        contractOwner = msg.sender;
        authorizedCallers[contractOwner] = true; // authorize contract owner
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that checks whether it is called from authorized contract
     */
    modifier requireAuthorizedCaller() {
        require(
            authorizedCallers[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }

    /**
     * @dev Modifier that requires the caller to be a registered airline
     */
    modifier requireRegisteredAirline() {
        require(
            airlines[msg.sender].isRegistered,
            "Caller is not a registered airline"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/
    function isContractAuthorized(address caller) public view returns (bool) {
        return authorizedCallers[caller] == true; 
    }

    function isAirlineAuthorized(address airline) public view returns (bool) {
        return authorizedCallers[airline] == true;
    }

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view requireAuthorizedCaller returns (bool) { 
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireAuthorizedCaller {
        operational = mode;
    }

    /**
     * @dev To authorize contract (this function can be requested from front-end)
     */
    function authorizeCaller(address caller) public requireContractOwner {
        authorizedCallers[caller] = true;
        emit AuthorizedContract(caller);
    }

    /**
     * @dev To deauthorize contract
     */
    function deauthorizeCaller(address caller) public requireContractOwner {
        authorizedCallers[caller] = false;
        emit DeauthorizedContract(caller);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /*------------------------------------------------------------------------------------------*/
    /*                                     AIRLINE FUNCTIONS                                    */
    /*------------------------------------------------------------------------------------------*/
    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(string calldata name, address airline)
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        require(
            !airlines[airline].isRegistered,
            "Flight is already registered"
        );
        airlines[airline] = Airline({
            airline: airline,
            name: name,
            isRegistered: true,
            isFunded: false
        });
        authorizedCallers[airline] = true; 
        registeredAirlines.push(airline);
        registeredAirlineNames.push(name);
    }


    /**
     * @dev funding a registered airline.
     *
     */
    function fundAirline(address airline)
        external
        requireIsOperational
        requireAuthorizedCaller
    {
        airlines[airline].isFunded = true;
        fundedAirlines.push(airline);
    }

    /**
     * @dev Returns airline name
     *
     */
    function getAirlineName(address airline)
        external
        view
        requireIsOperational
        requireAuthorizedCaller         
        returns (string memory)
    {
        return airlines[airline].name;
    }

    /**
     * @dev Get the number of registered airlines
     *
     */
    function getRegisteredAirlineCount() 
        public 
        view 
        requireIsOperational
        requireAuthorizedCaller 
        returns (uint256) {
        return registeredAirlines.length;
    }

    /**
     * @dev Get the number of funded airlines
     *
     */
    function getFundedAirlineCount() 
        public 
        view 
        requireIsOperational
        requireAuthorizedCaller 
        returns (uint256) {
        return fundedAirlines.length;
    }

    /**
     * @dev Checks whether an airline paid its fund
     */
    function isAirlineFunded(address airline)
        external
        view
        requireIsOperational
        requireAuthorizedCaller        
        returns (bool)
    {
        return airlines[airline].isFunded;
    }

    /**
     * @dev Checks whether an airline is registered
     */
    function isAirlineRegistered(address airline)
        external
        view
        requireIsOperational
        requireAuthorizedCaller        
        returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    /**
     * @dev Checks whether an airline is registered by name
     */
    function isAirlineNameRegistered(string calldata airlineName)
        external
        view
        requireIsOperational
        requireAuthorizedCaller        
        returns (bool)
    {
        for (uint256 i=0; i < registeredAirlineNames.length; i++) {
            if (keccak256(abi.encodePacked(registeredAirlineNames[i]))
                == keccak256(abi.encodePacked(airlineName))) {
                return true;
            }            
        }        
        return false;
    }

    /*------------------------------------------------------------------------------------------*/
    /*                                     FLIGHT FUNCTIONS                                     */
    /*------------------------------------------------------------------------------------------*/
    /**
     * @dev Register a flight
     */
    function registerFlight(
        address airline,
        string calldata flight,
        uint256 departureTime,
        uint8 statusCode
    ) external requireIsOperational requireAuthorizedCaller returns (bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        flights[key] = Flight({
            airline: airline,
            flight: flight,
            isRegistered: true,
            timestamp: departureTime,
            statusCode: statusCode
        });
        airlineFlights[airline].push(key);
        flightKeys.push(key);
        return flights[key].isRegistered;
    }

    /**
     * @dev Returns all registered flights of an airline.
     *
     */
    function getFlights(address airline) 
        external 
        view 
        requireIsOperational
        requireAuthorizedCaller        
        returns (bytes32[] memory) {
        return airlineFlights[airline];
    }

    /**
     * @dev Checks whether a flight is registered.
     *
     */
    function isFlightRegistered(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (bool)
    {
        return flights[flightKey].isRegistered;
    }

    /**
     * @dev Updates a flight status code.
     *
     */
    function updateFlightStatus(uint8 statusCode, bytes32 flightKey)
        external
        requireIsOperational
        requireAuthorizedCaller        
    {
        require(
            authorizedCallers[msg.sender] == true || (msg.sender == contractOwner),
            "Caller is not authorized"
        );        
        flights[flightKey].statusCode = statusCode;
    }

    /** 
     * @dev Returns all keys of registered flights
     */
    function getFlightKeys()
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (bytes32[] memory)
    {
        return flightKeys;
    }

    /** 
     * @dev Returns flight info
     */
    function getFlight(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireAuthorizedCaller        
        returns (
            address airline,
            string memory flight,
            uint256 departureTime,
            uint8 statusCode
        )
    {
        airline = flights[flightKey].airline;
        flight = flights[flightKey].flight;
        departureTime = flights[flightKey].timestamp;
        statusCode = flights[flightKey].statusCode;
    }

    /** 
     * @dev Checks whetehr a flight is delayed (status code 20)
     */
    function IsFlightDelayed(bytes32 flightKey)
    external
    view
    requireIsOperational
    returns (bool)
    {
        return flightDelays[flightKey];
    }

    /** 
     * @dev Builds a flight key
     */
    function getFlightKey(
        address airline,
        string memory flight,
        uint256 departureTime
    ) internal view requireIsOperational returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, departureTime));
    }

    /*------------------------------------------------------------------------------------------*/
    /*                                     PASSENGERS FUNCTIONS                                 */
    /*------------------------------------------------------------------------------------------*/

    function buyInsurance(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger,
        uint256 amount
    ) external requireIsOperational requireAuthorizedCaller {
        bytes32 flightKey = getFlightKey(airline, flight, departureTime);
        require(
            bytes(flights[flightKey].flight).length > 0,
            "Flight does not exist"
        );
        insurances[flightKey].insuranceAmount[passenger] = amount;
        insurances[flightKey].passengers.push(passenger);
        insurances[flightKey].isPaidOut = false;
    }

    /**
     *  @dev Returns all insured passengers of a flight
     */
    function getInsurees(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (address[] memory)
    {
        return insurances[flightKey].passengers;
    }

    /**
     *  @dev Returns paid insurance premium by flight info
     *
     */
    function getPremium(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger
    ) external view requireAuthorizedCaller returns (uint256) {
        bytes32 flightKey = getFlightKey(airline, flight, departureTime);
        return insurances[flightKey].insuranceAmount[passenger];
    }

    /**
     *  @dev Returns paid insurance premium by flight key and passenger
     *
     */
    function getPremium(bytes32 flightKey, address passenger)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (uint256)
    {
        return insurances[flightKey].insuranceAmount[passenger];
    }

    /**
     *  @dev Returns passenger refunded amount by flight info
     *
     */
    function getPayOutAmount(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger
    ) external view requireAuthorizedCaller returns (uint256) {
        bytes32 flightKey = getFlightKey(airline, flight, departureTime);
        return insurances[flightKey].payOutAmount[passenger];
    }

    /**
     *  @dev Returns passenger refunded amount by flight key and passenger
     *
     */
    function getPayOutAmount(bytes32 flightKey, address passenger)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (uint256)
    {
        return insurances[flightKey].payOutAmount[passenger];
    }

    /**
     *  @dev Checks whether insurance was paid to passengers
     *
     */
    function isInsurancePaidOut(bytes32 flightKey)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (bool)
    {
        return insurances[flightKey].isPaidOut;
    }


    /**
     *  @dev Returns passenger total refunds for all insured flights
     *
     */
    function getBalance(address passenger)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (uint256)
    {
        return insuranceRefunds[passenger];
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flightKey)
        external
        requireIsOperational
        requireAuthorizedCaller
    {
        // set flight as delayed due to status code 20.
        flightDelays[flightKey] = true;
        
        // Credit all insurees
        if (!insurances[flightKey].isPaidOut) {
            for (uint256 i = 0; i < insurances[flightKey].passengers.length; i++) {
                address passenger = insurances[flightKey].passengers[i];
                if (insurances[flightKey].payOutAmount[passenger] == 0){
                    uint256 purchasedAmount = insurances[flightKey].insuranceAmount[passenger];
                    uint256 payoutAmount = purchasedAmount.mul(3).div(2);
                    insurances[flightKey].payOutAmount[passenger] = payoutAmount;
                    insuranceRefunds[passenger] = insuranceRefunds[passenger].add(payoutAmount);
                    insurances[flightKey].isPaidOut = true;
                }
            }
        }
    }

    /**
     *  @dev Transfers payout to insuree
     *  
     */
    function payInsuree(address payable passenger)
        external
        requireIsOperational
        requireAuthorizedCaller
    {
        uint256 amount = insuranceRefunds[passenger];
        
        require(address(this).balance >= amount, "No enough funds available on contract to pay the insuree");

        for (uint256 i=0; i < flightKeys.length; i++) {
            bytes32 flightKey = flightKeys[i];
            for (uint256 j=0; j < insurances[flightKey].passengers.length; j++) {
                if (insurances[flightKey].passengers[j] == passenger &&
                    flightDelays[flightKey] &&
                    insurances[flightKey].payOutAmount[passenger] > 0) {
                    delete insurances[flightKey].passengers[j];
                    insurances[flightKey].insuranceAmount[passenger] = 0;
                    insurances[flightKey].payOutAmount[passenger] = 0;
                    // We don't want to leave a gap
                    for (uint idx = j; idx<insurances[flightKey].passengers.length-1; idx++){
                        insurances[flightKey].passengers[idx] = insurances[flightKey].passengers[idx+1];
                    }
                    delete insurances[flightKey].passengers[insurances[flightKey].passengers.length-1];
                    insurances[flightKey].passengers.length--;      
                    // Reset flight delay status
                    flightDelays[flightKey] = false;             
                }
            }    
        }
        insuranceRefunds[passenger] = 0;
        passenger.transfer(amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable requireAuthorizedCaller {}

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        fund();
    }
}
