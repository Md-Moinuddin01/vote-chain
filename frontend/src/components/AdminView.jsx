import React, { useState } from "react";
import { formatAddress, HARDHAT_DEFAULT_ACCOUNTS } from "../utils/web3Utils";

export default function AdminView({
  electionState,
  electionTitle,
  candidates,
  totalVotes,
  ownerAddress,
  account,
  onStartElection,
  onEndElection,
  onRegisterVoter,
  onAddCandidate,
  isActionLoading
}) {
  const [newVoterAddress, setNewVoterAddress] = useState("");
  const [newCandidateName, setNewCandidateName] = useState("");

  const isOwner = account && ownerAddress && account.toLowerCase() === ownerAddress.toLowerCase();
  const isElectionNotStarted = electionState === "NotStarted";
  const isElectionActive = electionState === "Active";
  const isElectionEnded = electionState === "Ended";

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!newVoterAddress.trim()) return;
    onRegisterVoter(newVoterAddress.trim());
    setNewVoterAddress("");
  };

  const handleAddCandidateSubmit = (e) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;
    onAddCandidate(newCandidateName.trim());
    setNewCandidateName("");
  };

  const handleQuickRegister = (addr) => {
    onRegisterVoter(addr);
  };

  // Compute leader / winner
  let leader = null;
  let highestVotes = -1;
  candidates.forEach(c => {
    const v = Number(c.voteCount || 0);
    if (v > highestVotes && v > 0) {
      highestVotes = v;
      leader = c;
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Warning banner if current wallet is not the owner */}
      {!isOwner && (
        <div className="glass-panel" style={{
          padding: "16px 20px",
          background: "rgba(244, 63, 94, 0.1)",
          border: "1px solid rgba(244, 63, 94, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: "#fca5a5"
        }}>
          <span style={{ fontSize: "1.4rem" }}>⚠️</span>
          <div>
            <strong>Administrator Access Restricted</strong>
            <div style={{ fontSize: "0.85rem", color: "#fecdd3" }}>
              Your current connected address ({formatAddress(account)}) is not the contract owner ({formatAddress(ownerAddress)}).
              Admin operations will fail smart contract verification. Switch to the owner account ({formatAddress(ownerAddress)}) in the top bar.
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "24px"
      }}>
        {/* 1. Election Lifecycle Control Card */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              ⏱️ Election Lifecycle Control
            </h3>
            <span className={`badge ${
              isElectionActive ? 'badge-active' : isElectionNotStarted ? 'badge-pending' : 'badge-ended'
            }`}>
              {electionState}
            </span>
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "20px" }}>
            Control the state machine of the election. Transitions are irreversibly recorded on Ethereum.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={onStartElection}
                disabled={!isElectionNotStarted || isActionLoading || !isOwner}
                className="btn btn-success"
                style={{ flex: 1, padding: "12px" }}
              >
                ▶ Start Election
              </button>

              <button
                onClick={onEndElection}
                disabled={!isElectionActive || isActionLoading || !isOwner}
                className="btn btn-danger"
                style={{ flex: 1, padding: "12px" }}
              >
                ⏹ End Election
              </button>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: "1.4" }}>
              {isElectionNotStarted && "• Election is pending. Click 'Start Election' to open ballot casting."}
              {isElectionActive && "• Election is currently active and accepting votes. Click 'End Election' to freeze tallies."}
              {isElectionEnded && "• Election is ended and final tallies are sealed. Results are permanent."}
            </div>
          </div>
        </div>

        {/* 2. Voter Registration Card */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "10px" }}>
            📝 Register Authorized Voter
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
            Add an Ethereum wallet address to the eligible voter registry mapping.
          </p>

          <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="0x... voter wallet address"
              value={newVoterAddress}
              onChange={(e) => setNewVoterAddress(e.target.value)}
              className="input-field"
              disabled={isElectionEnded || isActionLoading || !isOwner}
            />

            <button
              type="submit"
              disabled={!newVoterAddress.trim() || isElectionEnded || isActionLoading || !isOwner}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              + Register Voter
            </button>
          </form>

          {/* Quick Register Local Test Accounts */}
          <div style={{ marginTop: "18px" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
              Quick Register Hardhat Test Accounts:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {HARDHAT_DEFAULT_ACCOUNTS.slice(1, 5).map((acc) => (
                <button
                  key={acc.address}
                  onClick={() => handleQuickRegister(acc.address)}
                  disabled={isElectionEnded || isActionLoading || !isOwner}
                  className="btn btn-outline"
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  + {acc.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Add Candidate Card (when NotStarted) */}
        <div className="glass-panel" style={{ padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
              🏛️ Add Candidate
            </h3>
            <span className="badge badge-pending" style={{ fontSize: "0.7rem" }}>
              Pre-Election Only
            </span>
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
            Register additional candidates prior to opening the election.
          </p>

          <form onSubmit={handleAddCandidateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="Candidate Name & Platform"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
              className="input-field"
              disabled={!isElectionNotStarted || isActionLoading || !isOwner}
            />

            <button
              type="submit"
              disabled={!newCandidateName.trim() || !isElectionNotStarted || isActionLoading || !isOwner}
              className="btn btn-outline"
              style={{ width: "100%", borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              + Add Candidate
            </button>
          </form>

          {!isElectionNotStarted && (
            <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "var(--text-dim)" }}>
              🔒 Candidates cannot be added once the election has started or concluded.
            </div>
          )}
        </div>
      </div>

      {/* Live Results Section */}
      <div className="glass-panel" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "700" }}>
              📊 Live Election Tallies & Analytics
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
              Real-time on-chain vote aggregation directly queried from smart contract storage.
            </p>
          </div>

          {leader && (
            <div className="glass-panel" style={{
              padding: "10px 18px",
              background: "rgba(0, 242, 254, 0.1)",
              border: "1px solid rgba(0, 242, 254, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}>
              <span style={{ fontSize: "1.2rem" }}>🏆</span>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                  {isElectionEnded ? "Election Winner" : "Current Leader"}
                </div>
                <div style={{ fontWeight: "700", color: "var(--primary)", fontSize: "0.95rem" }}>
                  {leader.name} ({leader.voteCount.toString()} votes)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Table / Breakdown */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)", color: "var(--text-dim)", fontSize: "0.82rem", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>ID</th>
                <th style={{ padding: "12px 16px" }}>Candidate Name</th>
                <th style={{ padding: "12px 16px" }}>Votes</th>
                <th style={{ padding: "12px 16px" }}>Share</th>
                <th style={{ padding: "12px 16px" }}>Visual Distribution</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const count = Number(candidate.voteCount || 0);
                const total = Number(totalVotes || 0);
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const isLeader = leader && leader.id === candidate.id;

                return (
                  <tr key={candidate.id.toString()} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                    <td style={{ padding: "16px", fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                      #{candidate.id.toString()}
                    </td>
                    <td style={{ padding: "16px", fontWeight: "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {candidate.name}
                        {isLeader && <span title="Current Leader">⭐</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontFamily: "var(--font-mono)", fontWeight: "700" }}>
                      {count}
                    </td>
                    <td style={{ padding: "16px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {pct}%
                    </td>
                    <td style={{ padding: "16px", minWidth: "160px" }}>
                      <div style={{
                        width: "100%",
                        height: "10px",
                        background: "rgba(255, 255, 255, 0.06)",
                        borderRadius: "999px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: isLeader
                            ? "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)"
                            : "linear-gradient(90deg, #64748b 0%, #94a3b8 100%)",
                          borderRadius: "999px",
                          transition: "width 0.4s ease"
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
