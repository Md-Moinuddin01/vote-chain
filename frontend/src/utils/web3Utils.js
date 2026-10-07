import Web3 from "web3";
import contractArtifact from "../contracts/contractData.json";

// Standard election state mapping
export const ELECTION_STATES = {
  0: "NotStarted",
  1: "Active",
  2: "Ended"
};

export const HARDHAT_DEFAULT_ACCOUNTS = [
  { name: "Deployer / Admin", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
  { name: "Test Voter #1", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { name: "Test Voter #2", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { name: "Test Voter #3", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
  { name: "Test Voter #4", address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
  { name: "Test Voter #5", address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" }
];

/**
 * Initializes Web3 instance with MetaMask (window.ethereum) or fallback to local RPC
 */
export function getWeb3Instance() {
  if (typeof window !== "undefined" && window.ethereum) {
    return new Web3(window.ethereum);
  }
  // Fallback to local Hardhat RPC provider if no browser extension
  return new Web3("http://127.0.0.1:8545");
}

/**
 * Initializes the Voting Contract instance
 */
export function getVotingContract(web3, overrideAddress = null) {
  const address = overrideAddress || contractArtifact.address;
  if (!web3 || !address) return null;
  return new web3.eth.Contract(contractArtifact.abi, address);
}

/**
 * Formats an Ethereum address for display (0x1234...abcd)
 */
export function formatAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Parses contract transaction errors into user-friendly messages
 */
export function parseContractError(error) {
  if (!error) return "An unknown error occurred";

  const message = error.message || error.toString();

  // Common contract revert reasons
  if (message.includes("You are not a registered voter")) {
    return "Access Denied: Your wallet address is not registered for this election.";
  }
  if (message.includes("You have already cast your vote")) {
    return "Action Prohibited: You have already voted. Double-voting is strictly forbidden.";
  }
  if (message.includes("Election is not active")) {
    return "Voting Closed: The election is currently not active.";
  }
  if (message.includes("Only the election administrator can perform this action")) {
    return "Admin Only: Only the contract owner can perform this action.";
  }
  if (message.includes("Voter is already registered")) {
    return "Notice: This voter address is already registered.";
  }
  if (message.includes("Cannot register voters after election has ended")) {
    return "Registration Closed: Cannot register new voters after election has ended.";
  }
  if (message.includes("User rejected") || message.includes("user rejected transaction")) {
    return "Transaction cancelled by user in wallet.";
  }
  if (message.includes("Internal JSON-RPC error") && error.data) {
    return `Transaction error: ${JSON.stringify(error.data)}`;
  }

  return message.length > 120 ? message.substring(0, 120) + "..." : message;
}
