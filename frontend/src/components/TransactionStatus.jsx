import React from "react";
import { formatAddress } from "../utils/web3Utils";

export default function TransactionStatus({ status, onClose }) {
  if (!status || !status.type) return null;

  const isPending = status.type === "pending";
  const isSuccess = status.type === "success";
  const isError = status.type === "error";

  const getBgColor = () => {
    if (isPending) return "rgba(0, 242, 254, 0.12)";
    if (isSuccess) return "rgba(16, 185, 129, 0.12)";
    if (isError) return "rgba(244, 63, 94, 0.15)";
    return "var(--bg-card)";
  };

  const getBorderColor = () => {
    if (isPending) return "rgba(0, 242, 254, 0.4)";
    if (isSuccess) return "rgba(16, 185, 129, 0.4)";
    if (isError) return "rgba(244, 63, 94, 0.4)";
    return "var(--border-glass)";
  };

  return (
    <div className="glass-panel animate-fade-in" style={{
      padding: "16px 20px",
      backgroundColor: getBgColor(),
      borderColor: getBorderColor(),
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      marginBottom: "24px",
      boxShadow: isPending ? "0 0 25px rgba(0, 242, 254, 0.15)" : "var(--shadow-sm)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {isPending && (
          <div style={{
            width: "22px",
            height: "22px",
            border: "2px solid rgba(0, 242, 254, 0.3)",
            borderTop: "2px solid #00f2fe",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        )}
        {isSuccess && <span style={{ fontSize: "1.4rem" }}>🎉</span>}
        {isError && <span style={{ fontSize: "1.4rem" }}>❌</span>}

        <div>
          <div style={{
            fontWeight: "700",
            fontSize: "0.95rem",
            color: isPending ? "var(--primary)" : isSuccess ? "#34d399" : "#fb7185"
          }}>
            {status.title || (isPending ? "Transaction Pending" : isSuccess ? "Transaction Confirmed" : "Transaction Failed")}
          </div>
          <div style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: "2px" }}>
            {status.message}
          </div>
          {status.txHash && (
            <div style={{ fontSize: "0.76rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
              Tx Hash: {status.txHash}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-dim)",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: "4px 8px",
          borderRadius: "4px"
        }}
        title="Dismiss"
      >
        ✕
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
