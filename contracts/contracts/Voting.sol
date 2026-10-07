// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @dev Implements a secure blockchain-based voting system with role-based access,
 *      one-voter-one-vote enforcement, candidate management, and lifecycle states.
 */
contract Voting {
    // Enum representing election lifecycle stages
    enum ElectionState {
        NotStarted,
        Active,
        Ended
    }

    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // State Variables
    address public owner;
    string public electionTitle;
    ElectionState public electionState;
    Candidate[] public candidates;
    uint256 public totalVotes;

    // Mappings
    mapping(address => bool) public registeredVoters;
    mapping(address => bool) public hasVoted;

    // Events
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionStarted();
    event ElectionEnded();
    event CandidateAdded(uint256 indexed candidateId, string name);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the election administrator can perform this action");
        _;
    }

    modifier onlyDuringElection() {
        require(electionState == ElectionState.Active, "Election is not active");
        _;
    }

    modifier onlyBeforeElection() {
        require(electionState == ElectionState.NotStarted, "Cannot perform action after election has started");
        _;
    }

    /**
     * @dev Initializes election with a title and optional initial candidates.
     * @param _title Title or description of the election
     * @param _candidateNames Optional list of candidate names to register upfront
     */
    constructor(string memory _title, string[] memory _candidateNames) {
        owner = msg.sender;
        electionTitle = bytes(_title).length > 0 ? _title : "General Election";
        electionState = ElectionState.NotStarted;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            _addCandidate(_candidateNames[i]);
        }
    }

    /**
     * @dev Internal helper to add candidates
     */
    function _addCandidate(string memory _name) internal {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        uint256 newId = candidates.length;
        candidates.push(Candidate({
            id: newId,
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(newId, _name);
    }

    /**
     * @dev Adds a candidate before the election starts. Restricted to admin.
     * @param _name Name of the candidate
     */
    function addCandidate(string memory _name) external onlyOwner onlyBeforeElection {
        _addCandidate(_name);
    }

    /**
     * @dev Registers a single voter. Restricted to admin. Can register before or during active election.
     * @param _voter Address of the voter
     */
    function registerVoter(address _voter) public onlyOwner {
        require(_voter != address(0), "Cannot register zero address");
        require(electionState != ElectionState.Ended, "Cannot register voters after election has ended");
        require(!registeredVoters[_voter], "Voter is already registered");

        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    /**
     * @dev Batch voter registration for convenience.
     * @param _voters Array of voter addresses
     */
    function registerMultipleVoters(address[] calldata _voters) external onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    /**
     * @dev Starts the election. Restricted to admin.
     */
    function startElection() external onlyOwner {
        require(electionState == ElectionState.NotStarted, "Election is already started or ended");
        require(candidates.length >= 2, "Must register at least 2 candidates before starting election");
        
        electionState = ElectionState.Active;
        emit ElectionStarted();
    }

    /**
     * @dev Casts a single vote for a specified candidate.
     * @param _candidateId Zero-based index/ID of the candidate
     */
    function castVote(uint256 _candidateId) external onlyDuringElection {
        require(registeredVoters[msg.sender], "You are not a registered voter");
        require(!hasVoted[msg.sender], "You have already cast your vote");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += 1;
        totalVotes += 1;

        emit VoteCast(msg.sender, _candidateId);
    }

    /**
     * @dev Ends the election. Restricted to admin.
     */
    function endElection() external onlyOwner {
        require(electionState == ElectionState.Active, "Election is not active");
        
        electionState = ElectionState.Ended;
        emit ElectionEnded();
    }

    /**
     * @dev Returns the full list of candidates and their vote counts.
     */
    function getResults() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @dev Returns all candidates.
     */
    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @dev Returns candidate count.
     */
    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    /**
     * @dev Returns voter registration and voted status.
     * @param _voter Address of the voter to check
     */
    function getVoterStatus(address _voter) external view returns (bool isRegistered, bool voted) {
        return (registeredVoters[_voter], hasVoted[_voter]);
    }
}
