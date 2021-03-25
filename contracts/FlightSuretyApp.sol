pragma solidity ^0.5.16;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines
    uint256 constant MULTIPARTY_THRESHOLD = 4;
    uint256 constant MULTIPARTY_CONSENSUS_DIVISOR = 2;

    // Multi-party consensus for airline registration
    mapping(address => address[]) private registrationByConsensus;

    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract
    FlightSuretyData flightSuretyData; // Instance of FlightSuretyData
    address payable public dataContractAddress;

    uint256 public constant AIRLINE_MIN_FUND = 10 ether; //minimum fund required to participate in contract
    uint256 public constant MAX_INSURANCE_AMOUNT = 1 ether;

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
        require(
            flightSuretyData.isOperational(),
            "Contract is currently not operational"
        );
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    /*
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }
    */

    /**
     * @dev Modifier that requires the caller to be a registered airline
     */
    modifier requireRegisteredAirline() {
        require(
            flightSuretyData.isAirlineRegistered(msg.sender),
            "Caller is not a registered airline"
        );
        _;
    }

    /**
     * @dev Modifier that requires airline to be funded
     */
    modifier requireAirlineIsFunded(address airline) {
        require(
            flightSuretyData.isAirlineFunded(airline) || msg.sender == contractOwner,
            "Airline is not funded"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/
    event AirlineRegistered(string name, address addr, uint256 votes);
    event AirlineFunded(address addr, uint256 amount);
    event FlightRegistered(address indexed airline, string flight);
    event FlightInsurancePurchased(address indexed passenger, uint256 amount);
    event InsurancePayout(address indexed airline, string flight);
    event RefundWithdrawal(address indexed passenger);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/
    /**
     * @dev Contract constructor
     *
     */
    constructor(address payable dataContract) public {
        contractOwner = msg.sender;
        dataContractAddress = dataContract;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational();
    }

    function setOperatingStatus(bool mode) public {
        flightSuretyData.setOperatingStatus(mode);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /*------------------------------------------------------------------------------------------*/
    /*                                     AIRLINE FUNCTIONS                                    */
    /*------------------------------------------------------------------------------------------*/
    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(string calldata name, address airline)
        external
        requireIsOperational
        requireAirlineIsFunded(msg.sender)
        returns (bool success, uint256 votes)
    {
        bool registered = false;
        uint256 numberOfregisteredAirlines = flightSuretyData.getRegisteredAirlineCount();

        // Register first airline
        if (numberOfregisteredAirlines == 0) {
            flightSuretyData.registerAirline(name, airline);
            registered = true;
        } else if (numberOfregisteredAirlines < MULTIPARTY_THRESHOLD) {
            flightSuretyData.registerAirline(name, airline);
            registered = true;
        } else {
            // Multiparty Consensus:
            // Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines
            bool alreadyVoted = false;
            for (uint256 i = 0; i < registrationByConsensus[airline].length; i++) {
                if (registrationByConsensus[airline][i] == msg.sender) {
                    alreadyVoted = true;
                    break;
                }
            }
            if (!alreadyVoted) {
                registrationByConsensus[airline].push(msg.sender);
                if (
                    registrationByConsensus[airline].length >=
                    numberOfregisteredAirlines.div(MULTIPARTY_CONSENSUS_DIVISOR)
                ) {
                    flightSuretyData.registerAirline(name, airline);
                    registered = true;
                }
            }
        }
        if (registered){
            emit AirlineRegistered(
                name,
                airline,
                registrationByConsensus[airline].length
            );
            return (true, registrationByConsensus[airline].length);
        }
        return (false, registrationByConsensus[airline].length);
    }

    /**
     * @dev Returns airline name
     *
     */
    function getAirlineName(address airline)
        external
        view
        requireIsOperational
        returns (string memory)
    {
        return flightSuretyData.getAirlineName(airline);
    }

    /**
     * @dev Returns the minimum number of votes required to register an airline
     *
     */
    function getRequiredVotes()
        external
        view
        requireIsOperational
        returns (uint256 votes)
    {
        uint256 numberOfregisteredAirlines = flightSuretyData.getRegisteredAirlineCount();
        return numberOfregisteredAirlines.div(MULTIPARTY_CONSENSUS_DIVISOR);
    }    

    /**
     * @dev Returns the current number of registration votes for an airline
     *
     */
    function getVotes(address airline)
        external
        view
        requireIsOperational
        returns (uint256 votes)
    {
        return registrationByConsensus[airline].length;
    }    

    /**
     * @dev Checks whether an airline is registered
     *
     */
    function isAirlineRegistered(address airline) 
        external 
        view 
        requireIsOperational 
        returns (bool) {
        return flightSuretyData.isAirlineRegistered(airline);
    }

    /**
     * @dev Check whether an airline is registered by name
    */
    function isAirlineNameRegistered(string calldata airlineName)
        external
        view
        requireIsOperational
        returns (bool)
    {
        return flightSuretyData.isAirlineNameRegistered(airlineName);
    }      

    /**
     * @dev funding a registered airline.
     *
     */
    function fundAirline()
        external
        payable
        requireIsOperational
        requireRegisteredAirline
    {
        require(
            msg.value == AIRLINE_MIN_FUND,
            "10 Ether is required for funding"
        );

        dataContractAddress.transfer(msg.value);

        //address payable _dataContractAddress = address(uint160(dataContractAddress));
        //_dataContractAddress.transfer(msg.value);
        
        //address(uint160(address(flightSuretyData))).transfer(msg.value);
        //address(uint160(address(dataContractAddress))).transfer(msg.value);
        //address(uint160(address(flightSuretyData))).transfer(msg.value);

        //address(uint160(dataContractAddress)).transfer(msg.value);

        flightSuretyData.fundAirline(msg.sender);
        emit AirlineFunded(msg.sender, msg.value);
    }

    /**
     * @dev Checks whether an airline paid its seed fund.
     *
     */
    function isAirlineFunded(address airline) 
        external 
        view 
        requireIsOperational
        returns (bool) {
        return flightSuretyData.isAirlineFunded(airline);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(string calldata flight, uint256 departureTime)
        external
        requireIsOperational
        requireAirlineIsFunded(msg.sender)
    {
        flightSuretyData.registerFlight(
            msg.sender,
            flight,
            departureTime,
            STATUS_CODE_UNKNOWN
        );
        emit FlightRegistered(msg.sender, flight);
    }

    /**
     * @dev Returns all registered flights of an airline.
     *
     */
    function getFlights(address airline)
        external 
        view 
        requireIsOperational
        returns (bytes32[] memory) {
        return flightSuretyData.getFlights(airline);
    }

    /**
     * @dev Checks whether a flight is registered.
     *
     */
    function isFlightRegistered(
        address airline,
        string memory flight,
        uint256 departureTime
    ) public view requireIsOperational returns (bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        return flightSuretyData.isFlightRegistered(key);
    }

    function getFlightKeys() 
        external 
        view 
        requireIsOperational
        returns (bytes32[] memory) {
        return flightSuretyData.getFlightKeys();
    }

    function getFlight(bytes32 flightKey)
        external
        view
        requireIsOperational
        returns (
            address airline,
            string memory flight,
            uint256 departureTime,
            uint8 statusCode
        )
    {
        return flightSuretyData.getFlight(flightKey);
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 departureTime,
        uint8 statusCode
    ) internal requireIsOperational {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        flightSuretyData.updateFlightStatus(statusCode, key);
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(key);
            
            emit InsurancePayout(airline, flight);
        }
    }

    /**
     * @dev Generate a request for oracles to fetch flight information
     *
     */
    function fetchFlightStatus(
        address airline,
        string calldata flight,
        uint256 departureTime
    ) external requireIsOperational {
        uint8 index = getRandomIndex(msg.sender);
        // Generate a unique key for storing the request
        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, departureTime));
        oracleResponses[key] = ResponseInfo({
            requester: msg.sender,
            isOpen: true
        });
        emit OracleRequest(index, airline, flight, departureTime);
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
        return flightSuretyData.IsFlightDelayed(flightKey);
    }


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
    /**
     * @dev Buy insurance for a flight
     *
     */
    function buyInsurance(
        address airline,
        string calldata flight,
        uint256 departureTime
    ) external payable requireIsOperational {
        require(
            msg.value <= MAX_INSURANCE_AMOUNT,
            "Passenger can buy insurance for a maximum of 1 ether"
        );
        address(uint160(address(flightSuretyData))).transfer(msg.value);
        flightSuretyData.buyInsurance(
            airline,
            flight,
            departureTime,
            msg.sender,
            msg.value
        );
        emit FlightInsurancePurchased(msg.sender, msg.value);
    }

    /**
     *  @dev Returns all insured passengers of a flight
     */
    function getInsurees(bytes32 flightKey)
        external
        view
        requireIsOperational
        returns (address[] memory)
    {
        return flightSuretyData.getInsurees(flightKey);
    }

    /**
     *  @dev Returns paid insurance premium by flight info
     *
     */
    function getPremium(
        address airline,
        string calldata flight,
        uint256 departureTime
    ) external view returns (uint256) {
        return
            flightSuretyData.getPremium(
                airline,
                flight,
                departureTime,
                msg.sender
            );
    }

    /**
     *  @dev Returns paid insurance premium by flight key and passenger
     *
     */
    function getPremium(bytes32 flightKey, address passenger)
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return flightSuretyData.getPremium(flightKey, passenger);
    }

    /**
     *  @dev Returns passenger refunded amount by flight info
     *
     */
    function getPayOutAmount(
        address airline,
        string calldata flight,
        uint256 departureTime
    ) external view returns (uint256) {
        return
            flightSuretyData.getPayOutAmount(
                airline,
                flight,
                departureTime,
                msg.sender
            );
    }

    /**
     *  @dev Returns passenger refunded amount by flight key and passenger
     *
     */
    function getPayOutAmount(bytes32 flightKey, address passenger)
        external
        view
        requireIsOperational
        returns (uint256)
    {
        return flightSuretyData.getPayOutAmount(flightKey, passenger);
    }

    /**
     *  @dev Checks whether insurance was paid to passengers
     *
     */
    function isInsurancePaidOut(
        address airline,
        string calldata flight,
        uint256 departureTime
    ) external view requireIsOperational returns (bool) {
        bytes32 key = getFlightKey(airline, flight, departureTime);
        return flightSuretyData.isInsurancePaidOut(key);
    }

    /**
     *  @dev Returns passenger total refunds (multiple flights)
     *
     */
    function getBalance() 
        external 
        view 
        requireIsOperational 
        returns (uint256) {
        return flightSuretyData.getBalance(msg.sender);
    }

    function withdrawRefund() external requireIsOperational {
        flightSuretyData.payInsuree(msg.sender);
        emit RefundWithdrawal(msg.sender);
    }

    /*------------------------------------------------------------------------------------------*/
    /*                                     ORACLE MANAGEMENT                                    */
    /*------------------------------------------------------------------------------------------*/

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, departureTime)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 departureTime,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 departureTime,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 departureTime
    );

    // Register an oracle with the contract
    function registerOracle() external payable requireIsOperational {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function isOracleRegistered(address oracleAddress)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return oracles[oracleAddress].isRegistered;
    }

    function getOracleRegistrationFee() 
        external 
        view 
        requireIsOperational 
        returns (uint256) {
        return REGISTRATION_FEE;
    }

    function getMyIndexes() 
        external 
        view 
        requireIsOperational 
        returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string calldata flight,
        uint256 departureTime,
        uint8 statusCode
    ) external requireIsOperational {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, departureTime));
        require(
            oracleResponses[key].isOpen,
            "Flight or departureTime do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, departureTime, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, departureTime, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, departureTime, statusCode);
        }
    }

    /*------------------------------------------------------------------------------------------*/
    /*                                     UTILITIES                                            */
    /*------------------------------------------------------------------------------------------*/
    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random =
            uint8(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            blockhash(block.number - nonce++),
                            account
                        )
                    )
                ) % maxValue
            );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}

/********************************************************************************************/
/*                               STUBS FOR DATA CONTRACT                                     */
/********************************************************************************************/

contract FlightSuretyData {
    function isOperational() external view returns (bool);

    function setOperatingStatus(bool mode) external;

    function registerAirline(string calldata name, address airline) external;

    function getAirlineName(address airline) external view returns (string memory);

    function isAirlineRegistered(address airline) external view returns (bool);

    function isAirlineNameRegistered(string calldata airlineName) external view returns (bool);

    function getRegisteredAirlineCount() external view returns (uint256);

    function isAirlineFunded(address airline) external view returns (bool);

    function registerFlight(
        address airline,
        string calldata flight,
        uint256 departureTime,
        uint8 statusCode
    ) external;

    function fundAirline(address airline) external;

    function getFlights(address airline) external view returns (bytes32[] memory);

    function getFlightKeys() external view returns (bytes32[] memory);

    function getFlight(bytes32 flightKey)
        external
        view
        returns (
            address airline,
            string memory flight,
            uint256 departureTime,
            uint8 statusCode
        );

    function IsFlightDelayed(bytes32 flightKey) external view returns (bool);

    function isFlightRegistered(bytes32 flightKey) external view returns (bool);

    function updateFlightStatus(uint8 statusCode, bytes32 flightKey) external;

    function buyInsurance(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger,
        uint256 amount
    ) external;

    function getInsurees(bytes32 flightKey)
        external
        view
        returns (address[] memory);

    function getPremium(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger
    ) external view returns (uint256);

    function getPremium(bytes32 flightKey, address passenger)
        external
        view
        returns (uint256);

    function getPayOutAmount(
        address airline,
        string calldata flight,
        uint256 departureTime,
        address passenger
    ) external view returns (uint256);

    function getPayOutAmount(bytes32 flightKey, address passenger)
        external
        view
        returns (uint256);

    function creditInsurees(bytes32 flightKey) external;

    function isInsurancePaidOut(bytes32 flightKey) external view returns (bool);

    function getBalance(address passenger) external view returns (uint256);

    function payInsuree(address payable insuree) external;
}
