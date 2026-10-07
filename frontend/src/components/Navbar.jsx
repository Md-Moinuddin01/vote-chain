import React from "react";
import { formatAddress, HARDHAT_DEFAULT_ACCOUNTS } from "../utils/web3Utils";

export default function Navbar({
  account,
  networkId,
  isOwner,
  onConnectWallet,
  contractAddress,
  onAccountSelect,
  isMetaMaskAvailable
}) {
  return (
    <header style={{
      borderBottom: "1px solid var(--border-glass)",
      backgroundColor: "rgba(8, 11, 18, 0.85)",
      backdropFilter: "blur(20px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      padding: "16px 28px"
    }}>
      <div style={{
        maxWidth: "1300px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(0, 242, 254, 0.35)",
            color: "#040914",
            fontWeight: "900",
            fontSize: "1.25rem"
          }}>
            🗳️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.35rem", fontWeight: "800", letterSpacing: "-0.03em" }}>
                Vote<span className="text-gradient">Chain</span>
              </span>
              <span className="badge" style={{ backgroundColor: "rgba(0, 242, 254, 0.1)", color: "#00f2fe", border: "1px solid rgba(0, 242, 254, 0.25)" }}>
                Ethereum Web3
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
              Contract: {formatAddress(contractAddress)}
            </div>
          </div>
        </div>

        {/* Network & Account Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Network Badge */}
          <div className="glass-panel" style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}>
            <span className="pulse-dot" style={{ color: networkId === 31337n || networkId === 31337 ? "#10b981" : "#f59e0b" }}></span>
            <span style={{ color: "var(--text-muted)" }}>Network:</span>
            <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>
              {networkId === 31337n || networkId === 31337 ? "Hardhat Local (31337)" : networkId === 11155111n || networkId === 11155111 ? "Sepolia Testnet" : `Chain #${networkId || "Unknown"}`}
            </span>
          </div>

          {/* Quick Account Switcher for Hardhat testing */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              value={account || ""}
              onChange={(e) => onAccountSelect(e.target.value)}
              style={{
                background: "rgba(16, 23, 38, 0.9)",
                border: "1px solid var(--border-glass)",
                color: "var(--text-main)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.82rem",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                outline: "none"
              }}
              title="Select or switch to test account"
            >
              <option value="">Switch Test Signer...</option>
              {HARDHAT_DEFAULT_ACCOUNTS.map((acc, idx) => (
                <option key={acc.address} value={acc.address}>
                  {acc.name} ({formatAddress(acc.address)})
                </option>
              ))}
            </select>
          </div>

          {/* Role Badge */}
          {account && (
            <span className={`badge ${isOwner ? 'badge-admin' : 'badge-active'}`}>
              {isOwner ? "👑 Admin" : "👤 Voter"}
            </span>
          )}

          {/* Connect / Connected Button */}
          {account ? (
            <div className="glass-panel" style={{
              padding: "7px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 242, 254, 0.08)",
              border: "1px solid rgba(0, 242, 254, 0.3)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.88rem",
              fontWeight: "600"
            }}>
              <span style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#00f2fe",
                boxShadow: "0 0 10px #00f2fe"
              }}></span>
              {formatAddress(account)}
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="btn btn-primary"
              style={{ padding: "8px 18px", fontSize: "0.9rem" }}
            >
              🦊 {isMetaMaskAvailable ? "Connect MetaMask" : "Connect Provider"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
