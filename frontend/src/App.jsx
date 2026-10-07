import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import Navbar from "./components/Navbar";
import VoterView from "./components/VoterView";
import AdminView from "./components/AdminView";
import TransactionStatus from "./components/TransactionStatus";
import {
  getWeb3Instance,
  getVotingContract,
  ELECTION_STATES,
  parseContractError,
  formatAddress,
  HARDHAT_DEFAULT_ACCOUNTS
} from "./utils/web3Utils";
import contractArtifact from "./contracts/contractData.json";

export default function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [networkId, setNetworkId] = useState(null);
  const [contractAddress, setContractAddress] = useState(contractArtifact.address || "");
  const [isOwner, setIsOwner] = useState(false);

  // Contract State
  const [electionTitle, setElectionTitle] = useState("Decentralized Election");
  const [electionState, setElectionState] = useState("NotStarted");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [voterStatus, setVoterStatus] = useState({ isRegistered: false, hasVoted: false });

  // UI state
  const [activeTab, setActiveTab] = useState("voter");
  const [txStatus, setTxStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  // Initialize Web3 and Contract
  useEffect(() => {
    const init = async () => {
      try {
        const hasMM = typeof window !== "undefined" && Boolean(window.ethereum);
        setIsMetaMaskAvailable(hasMM);

        const instance = getWeb3Instance();
        setWeb3(instance);

        const voting = getVotingContract(instance, contractAddress);
        setContract(voting);

        // Fetch network
        try {
          const chainId = await instance.eth.getChainId();
          setNetworkId(Number(chainId));
        } catch (e) {
          console.warn("Could not retrieve chain ID:", e);
        }

        // Check for already connected accounts
        if (hasMM) {
          const accounts = await instance.eth.getAccounts();
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            // Default to first hardhat account for testing convenience if on localhost
            setAccount(contractArtifact.deployer || HARDHAT_DEFAULT_ACCOUNTS[0].address);
          }
        } else {
          // If no metamask, default to deployer address for local viewing
          setAccount(contractArtifact.deployer || HARDHAT_DEFAULT_ACCOUNTS[0].address);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    init();
  }, [contractAddress]);

  // Listen to MetaMask account & network changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setTxStatus({
            type: "info",
            title: "Wallet Switched",
            message: `Active account changed to ${formatAddress(accounts[0])}`
          });
        } else {
          setAccount("");
        }
      };

      const handleChainChanged = (chainIdHex) => {
        setNetworkId(parseInt(chainIdHex, 16));
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  // Fetch contract data
  const refreshContractData = useCallback(async () => {
    if (!contract || !contractAddress) return;

    try {
      setIsLoading(true);

      // Contract state calls
      const [title, rawState, owner, total, candidatesList] = await Promise.all([
        contract.methods.electionTitle().call().catch(() => "Decentralized Election"),
        contract.methods.electionState().call(),
        contract.methods.owner().call(),
        contract.methods.totalVotes().call(),
        contract.methods.getCandidates().call()
      ]);

      setElectionTitle(title);
      setElectionState(ELECTION_STATES[Number(rawState)] || "NotStarted");
      setOwnerAddress(owner);
      setTotalVotes(Number(total));

      // Format candidates
      const parsedCandidates = candidatesList.map((c) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount)
      }));
      setCandidates(parsedCandidates);

      // Check current account status
      if (account) {
        const ownerMatch = account.toLowerCase() === owner.toLowerCase();
        setIsOwner(ownerMatch);

        const status = await contract.methods.getVoterStatus(account).call();
        setVoterStatus({
          isRegistered: Boolean(status.isRegistered || status[0]),
          hasVoted: Boolean(status.voted || status[1])
        });
      }
    } catch (err) {
      console.error("Error refreshing contract state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [contract, contractAddress, account]);

  // Refresh whenever account or contract changes
  useEffect(() => {
    if (contract) {
      refreshContractData();
    }
  }, [contract, account, refreshContractData]);

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setTxStatus({
            type: "success",
            title: "Wallet Connected",
            message: `Connected to ${formatAddress(accounts[0])}`
          });
        }
      } else {
        setTxStatus({
          type: "info",
          title: "MetaMask Not Detected",
          message: "Connecting via default local Ethereum provider (http://127.0.0.1:8545)."
        });
      }
    } catch (err) {
      setTxStatus({
        type: "error",
        title: "Connection Failed",
        message: err.message || "Failed to connect wallet"
      });
    }
  };

  // Switch account manually or from test accounts
  const handleAccountSelect = (selectedAddr) => {
    if (!selectedAddr) return;
    setAccount(selectedAddr);
    setTxStatus({
      type: "info",
      title: "Active Account Changed",
      message: `Now acting as ${formatAddress(selectedAddr)}`
    });
  };

  // Voter Action: Cast Vote
  const handleCastVote = async (candidateId) => {
    if (!contract || !account) {
      setTxStatus({
        type: "error",
        title: "Wallet Not Ready",
        message: "Please connect your wallet first."
      });
      return;
    }

    try {
      setIsActionLoading(true);
      setTxStatus({
        type: "pending",
        title: "Casting Ballot On-Chain...",
        message: `Broadcasting vote for Candidate #${Number(candidateId) + 1}. Please confirm the transaction.`
      });

      const tx = await contract.methods.castVote(candidateId).send({ from: account });

      setTxStatus({
        type: "success",
        title: "Vote Cast Successfully!",
        message: `Your ballot has been irreversibly recorded in block #${tx.blockNumber}.`,
        txHash: tx.transactionHash
      });

      await refreshContractData();
    } catch (err) {
      console.error("Voting error:", err);
      setTxStatus({
        type: "error",
        title: "Failed to Cast Vote",
        message: parseContractError(err)
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin Action: Start Election
  const handleStartElection = async () => {
    try {
      setIsActionLoading(true);
      setTxStatus({
        type: "pending",
        title: "Starting Election...",
        message: "Invoking startElection() on the smart contract."
      });

      const tx = await contract.methods.startElection().send({ from: account });

      setTxStatus({
        type: "success",
        title: "Election Started!",
        message: "The election is now active. Registered voters may submit ballots.",
        txHash: tx.transactionHash
      });

      await refreshContractData();
    } catch (err) {
      setTxStatus({
        type: "error",
        title: "Start Election Failed",
        message: parseContractError(err)
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin Action: End Election
  const handleEndElection = async () => {
    try {
      setIsActionLoading(true);
      setTxStatus({
        type: "pending",
        title: "Ending Election...",
        message: "Invoking endElection() on the smart contract."
      });

      const tx = await contract.methods.endElection().send({ from: account });

      setTxStatus({
        type: "success",
        title: "Election Concluded",
        message: "Voting has been permanently closed. Final tallies are certified.",
        txHash: tx.transactionHash
      });

      await refreshContractData();
    } catch (err) {
      setTxStatus({
        type: "error",
        title: "End Election Failed",
        message: parseContractError(err)
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin Action: Register Voter
  const handleRegisterVoter = async (voterAddr) => {
    try {
      setIsActionLoading(true);
      setTxStatus({
        type: "pending",
        title: "Registering Voter...",
        message: `Adding ${formatAddress(voterAddr)} to the voter roll.`
      });

      const tx = await contract.methods.registerVoter(voterAddr).send({ from: account });

      setTxStatus({
        type: "success",
        title: "Voter Registered",
        message: `Address ${formatAddress(voterAddr)} is now eligible to vote.`,
        txHash: tx.transactionHash
      });

      await refreshContractData();
    } catch (err) {
      setTxStatus({
        type: "error",
        title: "Registration Failed",
        message: parseContractError(err)
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Admin Action: Add Candidate
  const handleAddCandidate = async (name) => {
    try {
      setIsActionLoading(true);
      setTxStatus({
        type: "pending",
        title: "Adding Candidate...",
        message: `Registering candidate "${name}" on-chain.`
      });

      const tx = await contract.methods.addCandidate(name).send({ from: account });

      setTxStatus({
        type: "success",
        title: "Candidate Added",
        message: `Candidate "${name}" registered successfully.`,
        txHash: tx.transactionHash
      });

      await refreshContractData();
    } catch (err) {
      setTxStatus({
        type: "error",
        title: "Add Candidate Failed",
        message: parseContractError(err)
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <Navbar
        account={account}
        networkId={networkId}
        isOwner={isOwner}
        onConnectWallet={handleConnectWallet}
        contractAddress={contractAddress}
        onAccountSelect={handleAccountSelect}
        isMetaMaskAvailable={isMetaMaskAvailable}
      />

      {/* Main Container */}
      <main style={{ maxWidth: "1300px", width: "100%", margin: "0 auto", padding: "32px 24px", flex: 1 }}>
        {/* Transaction Toast / Notification Banner */}
        <TransactionStatus status={txStatus} onClose={() => setTxStatus(null)} />

        {/* Top Hero Section */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "28px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className={`badge ${
                electionState === "Active" ? "badge-active" : electionState === "NotStarted" ? "badge-pending" : "badge-ended"
              }`}>
                <span className="pulse-dot"></span>
                Status: {electionState}
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
                Total Ballots: {totalVotes}
              </span>
            </div>
            <h1 style={{ fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2" }}>
              {electionTitle}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginTop: "6px" }}>
              Cryptographically secure voting with immutable smart contracts on Ethereum.
            </p>
          </div>

          {/* Navigation View Switcher (Tabs) */}
          <div className="glass-panel" style={{
            display: "inline-flex",
            padding: "4px",
            gap: "4px",
            borderRadius: "var(--radius-sm)"
          }}>
            <button
              onClick={() => setActiveTab("voter")}
              className="btn"
              style={{
                padding: "8px 20px",
                fontSize: "0.9rem",
                borderRadius: "var(--radius-sm)",
                background: activeTab === "voter" ? "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)" : "transparent",
                color: activeTab === "voter" ? "#040914" : "var(--text-muted)",
                boxShadow: activeTab === "voter" ? "0 4px 15px rgba(0, 242, 254, 0.25)" : "none"
              }}
            >
              🗳️ Voter Portal
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className="btn"
              style={{
                padding: "8px 20px",
                fontSize: "0.9rem",
                borderRadius: "var(--radius-sm)",
                background: activeTab === "admin" ? "linear-gradient(135deg, #7928ca 0%, #ff0080 100%)" : "transparent",
                color: activeTab === "admin" ? "#ffffff" : "var(--text-muted)",
                boxShadow: activeTab === "admin" ? "0 4px 15px rgba(121, 40, 202, 0.3)" : "none"
              }}
            >
              ⚙️ Admin Dashboard {isOwner && "👑"}
            </button>
          </div>
        </div>

        {/* View Component Render */}
        {activeTab === "voter" ? (
          <VoterView
            electionState={electionState}
            electionTitle={electionTitle}
            candidates={candidates}
            totalVotes={totalVotes}
            voterStatus={voterStatus}
            account={account}
            onCastVote={handleCastVote}
            isVotingLoading={isActionLoading}
          />
        ) : (
          <AdminView
            electionState={electionState}
            electionTitle={electionTitle}
            candidates={candidates}
            totalVotes={totalVotes}
            ownerAddress={ownerAddress}
            account={account}
            onStartElection={handleStartElection}
            onEndElection={handleEndElection}
            onRegisterVoter={handleRegisterVoter}
            onAddCandidate={handleAddCandidate}
            isActionLoading={isActionLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-glass)",
        backgroundColor: "rgba(8, 11, 18, 0.9)",
        padding: "24px",
        marginTop: "40px",
        fontSize: "0.85rem",
        color: "var(--text-dim)"
      }}>
        <div style={{
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            VoteChain Protocol • Built with Solidity ^0.8.20, Hardhat, Web3.js & React
          </div>
          <div style={{ display: "flex", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
            <span>Network: {networkId === 31337 ? "Hardhat (31337)" : "Sepolia (11155111)"}</span>
            <span>Contract: {formatAddress(contractAddress)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
