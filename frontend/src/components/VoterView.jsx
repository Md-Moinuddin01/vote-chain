import React, { useState } from "react";
import { formatAddress } from "../utils/web3Utils";

export default function VoterView({
  electionState,
  electionTitle,
  candidates,
  totalVotes,
  voterStatus,
  account,
  onCastVote,
  isVotingLoading
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const isElectionActive = electionState === "Active";
  const isElectionEnded = electionState === "Ended";
  const isElectionNotStarted = electionState === "NotStarted";

  const isRegistered = voterStatus?.isRegistered || false;
  const hasVoted = voterStatus?.hasVoted || false;
  const canVote = isElectionActive && isRegistered && !hasVoted && account;

  const handleVoteSubmit = (candidateId) => {
    if (!canVote) return;
    onCastVote(candidateId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Voter Status Hero Banner */}
      <div className="glass-panel" style={{
        padding: "24px 28px",
        background: hasVoted
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 23, 38, 0.8) 100%)"
          : !isRegistered
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 23, 38, 0.8) 100%)"
            : "linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(16, 23, 38, 0.8) 100%)",
        border: hasVoted
          ? "1px solid rgba(16, 185, 129, 0.3)"
          : !isRegistered
            ? "1px solid rgba(245, 158, 11, 0.3)"
            : "1px solid rgba(0, 242, 254, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.2rem" }}>
                {hasVoted ? "✅" : !isRegistered ? "⚠️" : "🗳️"}
              </span>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>
                {hasVoted
                  ? "Your Ballot Has Been Recorded"
                  : !isRegistered
                    ? "Voter Not Registered"
                    : isElectionActive
                      ? "You Are Eligible To Vote"
                      : "Registered Voter"}
              </h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", maxWidth: "600px" }}>
              {hasVoted
                ? "Your vote has been cryptographically verified and permanently committed to the Ethereum ledger. Under the one-voter-one-vote protocol, no further votes may be submitted."
                : !isRegistered
                  ? "Your connected wallet is not currently on the registered voter roll. Please request registration from the election administrator."
                  : isElectionActive
                    ? "Review the official candidates below and cast your single ballot. Once confirmed on-chain, your vote cannot be altered."
                    : isElectionNotStarted
                      ? "The election has not started yet. You are registered and will be able to cast your ballot once the administrator opens voting."
                      : "The election has concluded. Review final certified tallies below."}
            </p>
          </div>

          {/* Indicators */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div className="glass-panel" style={{ padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Registration</div>
              <div style={{
                fontWeight: "700",
                color: isRegistered ? "var(--accent-emerald)" : "var(--accent-amber)",
                fontSize: "0.95rem"
              }}>
                {isRegistered ? "Verified ✓" : "Unregistered ✕"}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Vote Status</div>
              <div style={{
                fontWeight: "700",
                color: hasVoted ? "var(--accent-emerald)" : isElectionActive ? "var(--primary)" : "var(--text-muted)",
                fontSize: "0.95rem"
              }}>
                {hasVoted ? "Already Voted ✓" : "Not Voted Yet"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Selection Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: "700" }}>
            Official Candidates ({candidates.length})
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Total verifiable votes cast: <strong style={{ color: "var(--text-main)" }}>{totalVotes}</strong>
          </p>
        </div>

        {/* Status reminder */}
        {!canVote && account && (
          <div style={{
            fontSize: "0.85rem",
            color: hasVoted ? "#34d399" : "#f59e0b",
            background: "rgba(255, 255, 255, 0.03)",
            padding: "6px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-glass)"
          }}>
            {hasVoted
              ? "✓ You have already participated in this election"
              : !isRegistered
                ? "✕ Unregistered account cannot cast votes"
                : !isElectionActive
                  ? "⏳ Voting inactive until election is started"
                  : ""}
          </div>
        )}
      </div>

      {/* Candidates Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px"
      }}>
        {candidates.map((candidate) => {
          const voteCountNum = Number(candidate.voteCount || 0);
          const totalVotesNum = Number(totalVotes || 0);
          const percentage = totalVotesNum > 0 ? ((voteCountNum / totalVotesNum) * 100).toFixed(1) : 0;
          const isSelected = selectedCandidate === candidate.id;

          return (
            <div
              key={candidate.id.toString()}
              className="glass-panel"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                transition: "all 0.25s ease",
                border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-glass)",
                background: isSelected ? "var(--bg-card-hover)" : "var(--bg-card)"
              }}
            >
              {/* Candidate Card Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-glass)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontFamily: "var(--font-mono)",
                    color: "var(--primary)"
                  }}>
                    #{Number(candidate.id) + 1}
                  </div>
                  <span className="badge badge-active" style={{ fontSize: "0.72rem" }}>
                    Candidate ID: {candidate.id.toString()}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "12px", lineHeight: "1.35" }}>
                  {candidate.name}
                </h3>

                {/* Live Vote Share Bar */}
                <div style={{ marginTop: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    <span>Recorded Ballots</span>
                    <span style={{ fontWeight: "600", color: "var(--text-main)" }}>
                      {voteCountNum} ({percentage}%)
                    </span>
                  </div>
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    borderRadius: "999px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${percentage}%`,
                      background: "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)",
                      borderRadius: "999px",
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
              </div>

              {/* Vote Action */}
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={() => handleVoteSubmit(candidate.id)}
                  disabled={!canVote || isVotingLoading}
                  className={`btn ${canVote ? "btn-primary" : "btn-outline"}`}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    fontSize: "0.95rem"
                  }}
                  title={
                    !account
                      ? "Connect wallet to vote"
                      : !isRegistered
                        ? "Only registered voters can cast a ballot"
                        : hasVoted
                          ? "You have already voted"
                          : !isElectionActive
                            ? "Election is not currently active"
                            : "Cast immutable ballot for this candidate"
                  }
                >
                  {isVotingLoading ? (
                    "Confirming in Wallet..."
                  ) : hasVoted ? (
                    "✓ Already Voted"
                  ) : !isRegistered ? (
                    "Registration Required"
                  ) : !isElectionActive ? (
                    isElectionEnded ? "Election Ended" : "Election Pending"
                  ) : (
                    "🗳️ Vote for Candidate"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
