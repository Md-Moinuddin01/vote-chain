const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("=================================================");
  console.log("🚀 Deploying Voting Contract");
  console.log("=================================================");
  console.log(`Network Name:   ${hre.network.name}`);
  console.log(`Chain ID:       ${network.chainId}`);
  console.log(`Deployer Admin: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Initial election parameters
  const electionTitle = "2026 Web3 Global Governance Election";
  const initialCandidates = [
    "Alex Rivera (Decentralization & Security)",
    "Dr. Sarah Chen (Privacy & Zero-Knowledge)",
    "Marcus Vance (Scalability & Layer-2)"
  ];

  console.log("\n📦 Deploying contract with candidates:", initialCandidates);
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(electionTitle, initialCandidates);

  await voting.waitForDeployment();
  const contractAddress = await voting.getAddress();

  console.log(`✅ Voting contract deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Test voters registration
  const signers = await hre.ethers.getSigners();
  if (signers.length > 1) {
    console.log("\n👥 Registering test voter accounts on local network...");
    const testVoters = signers.slice(1, Math.min(signers.length, 6)).map(s => s.address);
    for (let i = 0; i < testVoters.length; i++) {
      const tx = await voting.registerVoter(testVoters[i]);
      await tx.wait();
      console.log(`   Registered test voter #${i + 1}: ${testVoters[i]}`);
    }
  } else {
    // If on testnet with only 1 signer, register deployer as a voter or leave open for admin registration
    console.log("\nℹ️ Single signer detected. Registering deployer as an authorized voter for testing...");
    try {
      const tx = await voting.registerVoter(deployer.address);
      await tx.wait();
      console.log(`   Registered admin/deployer as voter: ${deployer.address}`);
    } catch (e) {
      console.log("   Voter registration skipped or already registered:", e.message);
    }
  }

  // Add an extra candidate to verify addCandidate function
  console.log("\n🏛️ Registering extra candidate 'Elena Rostova (Green Blockchain)'...");
  const addCandidateTx = await voting.addCandidate("Elena Rostova (Green Blockchain)");
  await addCandidateTx.wait();
  console.log("   Extra candidate registered successfully.");

  // Read standard artifact ABI
  const artifact = hre.artifacts.readArtifactSync("Voting");

  // Export contract deployment info for React frontend
  const deploymentData = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    electionTitle: electionTitle,
    abi: artifact.abi
  };

  // Ensure export directories exist
  const frontendContractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const exportPath = path.join(frontendContractsDir, "contractData.json");
  fs.writeFileSync(exportPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n💾 Saved deployment artifacts and ABI to: ${exportPath}`);

  // Also write to contracts directory for record
  fs.writeFileSync(path.join(__dirname, "../deployedAddress.json"), JSON.stringify(deploymentData, null, 2));

  console.log("\n=================================================");
  console.log("🎉 Deployment & initialization complete!");
  console.log("=================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
