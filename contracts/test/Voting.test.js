const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;
  let nonVoter;
  let candidatesInitial = ["Alice Johnson", "Bob Smith", "Charlie Davis"];

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();

    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy("2026 Student Council Election", candidatesInitial);
    await voting.waitForDeployment();
  });

  describe("Deployment and Initialization", function () {
    it("should set the deployer as owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("should set the initial election title", async function () {
      expect(await voting.electionTitle()).to.equal("2026 Student Council Election");
    });

    it("should initialize election in NotStarted state", async function () {
      expect(await voting.electionState()).to.equal(0); // NotStarted = 0
    });

    it("should initialize with candidates provided", async function () {
      const candidates = await voting.getCandidates();
      expect(candidates.length).to.equal(3);
      expect(candidates[0].name).to.equal("Alice Johnson");
      expect(candidates[0].voteCount).to.equal(0);
      expect(candidates[1].name).to.equal("Bob Smith");
      expect(candidates[2].name).to.equal("Charlie Davis");
    });
  });

  describe("Admin Candidate Management", function () {
    it("should allow owner to add candidates before election starts", async function () {
      await expect(voting.connect(owner).addCandidate("Diana Prince"))
        .to.emit(voting, "CandidateAdded")
        .withArgs(3, "Diana Prince");

      expect(await voting.getCandidateCount()).to.equal(4);
    });

    it("should prevent non-admin from adding candidate", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Diana Prince")
      ).to.be.revertedWith("Only the election administrator can perform this action");
    });

    it("should prevent adding empty candidate name", async function () {
      await expect(
        voting.connect(owner).addCandidate("")
      ).to.be.revertedWith("Candidate name cannot be empty");
    });
  });

  describe("Admin-Only Access & Voter Registration", function () {
    it("should allow owner to register single voter and emit VoterRegistered", async function () {
      await expect(voting.connect(owner).registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(voter1.address);

      const status = await voting.getVoterStatus(voter1.address);
      expect(status.isRegistered).to.be.true;
      expect(status.voted).to.be.false;
    });

    it("should prevent non-admin from registering a voter", async function () {
      await expect(
        voting.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWith("Only the election administrator can perform this action");
    });

    it("should prevent registering the same voter twice", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      await expect(
        voting.connect(owner).registerVoter(voter1.address)
      ).to.be.revertedWith("Voter is already registered");
    });

    it("should prevent registering zero address", async function () {
      await expect(
        voting.connect(owner).registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Cannot register zero address");
    });

    it("should allow batch registration by owner", async function () {
      await voting.connect(owner).registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
      expect(await voting.registeredVoters(voter1.address)).to.be.true;
      expect(await voting.registeredVoters(voter2.address)).to.be.true;
      expect(await voting.registeredVoters(voter3.address)).to.be.true;
    });
  });

  describe("Election Lifecycle Control", function () {
    it("should allow owner to start election and emit ElectionStarted", async function () {
      await expect(voting.connect(owner).startElection())
        .to.emit(voting, "ElectionStarted");

      expect(await voting.electionState()).to.equal(1); // Active = 1
    });

    it("should prevent non-admin from starting election", async function () {
      await expect(
        voting.connect(voter1).startElection()
      ).to.be.revertedWith("Only the election administrator can perform this action");
    });

    it("should prevent starting election twice", async function () {
      await voting.connect(owner).startElection();
      await expect(
        voting.connect(owner).startElection()
      ).to.be.revertedWith("Election is already started or ended");
    });

    it("should allow owner to end election and emit ElectionEnded", async function () {
      await voting.connect(owner).startElection();
      await expect(voting.connect(owner).endElection())
        .to.emit(voting, "ElectionEnded");

      expect(await voting.electionState()).to.equal(2); // Ended = 2
    });

    it("should prevent non-admin from ending election", async function () {
      await voting.connect(owner).startElection();
      await expect(
        voting.connect(voter1).endElection()
      ).to.be.revertedWith("Only the election administrator can perform this action");
    });

    it("should prevent ending election before it starts", async function () {
      await expect(
        voting.connect(owner).endElection()
      ).to.be.revertedWith("Election is not active");
    });

    it("should prevent voter registration after election has ended", async function () {
      await voting.connect(owner).startElection();
      await voting.connect(owner).endElection();
      await expect(
        voting.connect(owner).registerVoter(voter1.address)
      ).to.be.revertedWith("Cannot register voters after election has ended");
    });
  });

  describe("Voting Process & Security Constraints", function () {
    beforeEach(async function () {
      // Register voter1 and voter2
      await voting.connect(owner).registerVoter(voter1.address);
      await voting.connect(owner).registerVoter(voter2.address);
    });

    it("should prevent voting before election starts", async function () {
      await expect(
        voting.connect(voter1).castVote(0)
      ).to.be.revertedWith("Election is not active");
    });

    it("should REJECT unregistered voter from voting (Unregistered voter rejection)", async function () {
      await voting.connect(owner).startElection();

      await expect(
        voting.connect(nonVoter).castVote(0)
      ).to.be.revertedWith("You are not a registered voter");
    });

    it("should successfully cast a vote and update counts and emit VoteCast", async function () {
      await voting.connect(owner).startElection();

      await expect(voting.connect(voter1).castVote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0);

      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
      expect(await voting.totalVotes()).to.equal(1);

      const status = await voting.getVoterStatus(voter1.address);
      expect(status.voted).to.be.true;
    });

    it("should PREVENT double voting by same registered voter (Double-vote prevention)", async function () {
      await voting.connect(owner).startElection();

      // First vote succeeds
      await voting.connect(voter1).castVote(0);

      // Second vote attempts to cast again
      await expect(
        voting.connect(voter1).castVote(1)
      ).to.be.revertedWith("You have already cast your vote");

      // Verify vote count didn't increase
      const candidates = await voting.getCandidates();
      expect(candidates[0].voteCount).to.equal(1);
      expect(candidates[1].voteCount).to.equal(0);
      expect(await voting.totalVotes()).to.equal(1);
    });

    it("should reject vote for non-existent candidate ID", async function () {
      await voting.connect(owner).startElection();

      await expect(
        voting.connect(voter1).castVote(999)
      ).to.be.revertedWith("Invalid candidate ID");
    });

    it("should prevent voting after election ends", async function () {
      await voting.connect(owner).startElection();
      await voting.connect(owner).endElection();

      await expect(
        voting.connect(voter1).castVote(0)
      ).to.be.revertedWith("Election is not active");
    });
  });

  describe("Election Results", function () {
    it("should correctly record and report election results", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      await voting.connect(owner).registerVoter(voter2.address);
      await voting.connect(owner).registerVoter(voter3.address);

      await voting.connect(owner).startElection();

      await voting.connect(voter1).castVote(0); // Alice
      await voting.connect(voter2).castVote(0); // Alice
      await voting.connect(voter3).castVote(1); // Bob

      const results = await voting.getResults();
      expect(results[0].voteCount).to.equal(2);
      expect(results[1].voteCount).to.equal(1);
      expect(results[2].voteCount).to.equal(0);
      expect(await voting.totalVotes()).to.equal(3);

      await voting.connect(owner).endElection();
      // Results still accessible after ending
      const finalResults = await voting.getResults();
      expect(finalResults[0].voteCount).to.equal(2);
    });
  });
});
