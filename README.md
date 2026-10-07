# VoteChain | Decentralized Ethereum Voting System

<p align="center">
  <img width="100%" alt="VoteChain Banner" src="https://github.com/user-attachments/assets/e39e07be-1844-45de-9db1-70300b48ee9d" />
</p>

A secure, decentralized, tamper-proof voting system built with **Solidity**, **Ethereum**, **Web3.js**, and **React**.

---

## 🏛️ Architecture Overview

The system implements a robust three-layer architecture:
1. **Smart Contract Layer (`contracts/contracts/Voting.sol`)**:
   - Solidity `^0.8.20` smart contract deployed to Ethereum.
   - Enforces **one-voter-one-vote**, registered-voter-only access, immutable state machine (`NotStarted`, `Active`, `Ended`), and candidate vote tallies.
   - Restricts administrative controls (registration, lifecycle) strictly to the contract owner (`onlyOwner`).
   - Emits events: `VoterRegistered`, `VoteCast`, `ElectionStarted`, `ElectionEnded`, `CandidateAdded`.

2. **Blockchain Communication Layer (`frontend/src/utils/web3Utils.js`)**:
   - Web3.js client library connecting with MetaMask (`window.ethereum`) or local JSON-RPC nodes (`http://127.0.0.1:8545`).
   - Provides ABI parsing, transaction handling, address formatting, and error decoding for revert messages.

3. **User Interface Layer (`frontend/`)**:
   - Modern React frontend with dark-mode glassmorphic aesthetics.
   - **Voter Portal**: Live election status, real-time vote distribution, ballot submission with one-voter-one-vote validation, already-voted indicators.
   - **Admin Dashboard**: Start/End election controls, single & batch voter registration, candidate onboarding, and real-time tallies.
   - **Transaction Status Center**: Live transaction toasts with confirmations, hashes, and detailed error messages.

---

## 📁 Repository Structure

```text
bvs (blockchain voting/
├── contracts/
│   ├── contracts/
│   │   └── Voting.sol               # Core Solidity voting contract
│   ├── scripts/
│   │   ├── deploy.js                # Hardhat deployment script (exports ABI & address)
│   │   └── verify-interaction.js    # On-chain interaction & security verification
│   ├── test/
│   │   └── Voting.test.js           # 26 automated unit & security tests
│   ├── hardhat.config.js            # Hardhat configuration (Localhost & Sepolia)
│   └── .env.example                 # Environment template for Sepolia RPC & keys
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Wallet connection, network indicator & account switcher
│   │   │   ├── VoterView.jsx        # Candidate cards, vote button & eligibility status
│   │   │   ├── AdminView.jsx        # Administrative lifecycle & registration controls
│   │   │   └── TransactionStatus.jsx# Pending/Success/Error toast banner
│   │   ├── contracts/
│   │   │   └── contractData.json    # Deployed contract address & standard ABI
│   │   ├── utils/
│   │   │   └── web3Utils.js         # Web3.js integration & contract helpers
│   │   ├── App.jsx                  # Main application state and tab routing
│   │   └── index.css                # Custom Web3 vanilla CSS design system
│   ├── index.html                   # HTML template with Outfit & Inter typography
│   └── vite.config.js               # Vite configuration
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MetaMask](https://metamask.io/) browser extension (optional for browser interaction)

---

### 2. Run Hardhat Tests
Verify all 26 unit tests covering double-voting prevention, unregistered voter rejection, and admin access:

```bash
cd contracts
npx hardhat test
```

---

### 3. Start Local Blockchain & Deploy

In your first terminal, launch a local Hardhat node:
```bash
cd contracts
npx hardhat node
```

In a second terminal, deploy the smart contract and pre-register test candidates & voters:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

To run the automated verification script:
```bash
npx hardhat run scripts/verify-interaction.js --network localhost
```

---

### 4. Run the React Frontend

In another terminal, start the Vite development server:
```bash
cd frontend
npm run dev
```

Open your browser to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🌐 Deploying to Ethereum Sepolia Testnet

1. Copy `.env.example` to `.env` inside the `contracts` directory:
   ```bash
   cd contracts
   cp .env.example .env
   ```
2. Set your Sepolia credentials in `.env`:
   ```ini
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=YOUR_SEPOLIA_ACCOUNT_PRIVATE_KEY
   ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
   ```
3. Run the deployment script to Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. The deployment script will automatically update `frontend/src/contracts/contractData.json` with your deployed Sepolia contract address and ABI!

---

## 🔒 Security & Verification Highlights
- **Double-Vote Prevention**: Enforced via `mapping(address => bool) public hasVoted` inside `castVote()`. Re-voting attempts revert with `"You have already cast your vote"`.
- **Registered-Voter-Only Access**: Enforced via `mapping(address => bool) public registeredVoters` inside `castVote()`. Unregistered accounts revert with `"You are not a registered voter"`.
- **Admin Access Control**: Lifecycle functions (`startElection`, `endElection`, `registerVoter`, `addCandidate`) are guarded by `onlyOwner`. Non-admin calls revert with `"Only the election administrator can perform this action"`.
- **Immutable State Machine**: Voters can only cast ballots during `Active` state; candidates can only be registered in `NotStarted` state.
