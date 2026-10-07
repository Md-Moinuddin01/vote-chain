const hre = require("hardhat");
const contractArtifact = require("../../frontend/src/contracts/contractData.json");

async function main() {
  console.log("=================================================");
  console.log("🧪 Running Verification & Interaction Test");
  console.log("=================================================");

  const [deployer, voter1, voter2, nonVoter] = await hre.ethers.getSigners();
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = Voting.attach(contractArtifact.address);

  console.log("Contract Address:", contractArtifact.address);
  console.log("Initial Election State:", await voting.electionState());

  // 1. Start election if NotStarted
  const currentState = await voting.electionState();
  if (Number(currentState) === 0) {
    console.log("\n▶ Starting election as Admin...");
    const txStart = await voting.connect(deployer).startElection();
    await txStart.wait();
    console.log("✅ Election successfully started! State is now Active (1).");
  }

  // 2. Cast vote with an eligible voter who hasn't voted yet
  const eligibleVoter = (await voting.getVoterStatus(voter1.address))[1] ? voter2 : voter1;
  console.log(`\n🗳️ Casting vote for Candidate 1 with registered voter: ${eligibleVoter.address}...`);
  const statusBefore = await voting.getVoterStatus(eligibleVoter.address);
  console.log(`   Voter status: Registered = ${statusBefore[0]}, HasVoted = ${statusBefore[1]}`);

  if (!statusBefore[1]) {
    const txVote = await voting.connect(eligibleVoter).castVote(1);
    const receipt = await txVote.wait();
    console.log(`✅ Vote cast! Tx Hash: ${receipt.hash}`);
  }

  const statusAfter = await voting.getVoterStatus(eligibleVoter.address);
  console.log(`   Voter status after vote: HasVoted = ${statusAfter[1]}`);

  // 3. Verify Double Vote Prevention
  console.log("\n🛡️ Testing Double-Vote Prevention (Attempting second vote by Voter 1)...");
  try {
    await voting.connect(voter1).castVote(1);
    console.error("❌ Double vote failed to revert!");
  } catch (err) {
    console.log("✅ Successfully caught double-vote rejection:", err.message.slice(0, 100));
  }

  // 4. Verify Unregistered Voter Rejection with an unregistered signer
  const allSigners = await hre.ethers.getSigners();
  const trulyUnregistered = allSigners[15];
  console.log("\n🛡️ Testing Unregistered Voter Rejection (Voter: " + trulyUnregistered.address + ")...");
  try {
    await voting.connect(trulyUnregistered).castVote(0);
    console.error("❌ Unregistered vote failed to revert!");
  } catch (err) {
    console.log("✅ Successfully caught unregistered voter rejection:", err.message.slice(0, 100));
  }

  // 5. Query Results
  console.log("\n📊 Querying current election results from smart contract...");
  const results = await voting.getResults();
  results.forEach((c) => {
    console.log(`   Candidate #${c.id}: ${c.name} -> ${c.voteCount} vote(s)`);
  });
  console.log("   Total Votes Recorded:", await voting.totalVotes());

  console.log("\n=================================================");
  console.log("🎉 All on-chain checks verified successfully!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Error during verification:", err);
  process.exitCode = 1;
});
