"use client";

import { useState } from "react";

const CORRECT_PASSWORD = "coorie";
const SAGE = "#7A9A7E";
const SAND = "#C9B896";

export function PasswordGate({ onAuthorized }: { onAuthorized: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) onAuthorized();
    else setError(true);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "radial-gradient(ellipse at top, #142218 0%, #0d1611 55%, #0a0f0c 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "Inter, sans-serif", color: "#ffffff",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 360,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${SAGE}40`,
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderRadius: 14, padding: "1.75rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/coorie-white.svg" alt="Coorie Beauty"
            width={180} height={38}
            style={{ display: "inline-block", height: 38, width: "auto", maxWidth: "70%" }} />
          <p style={{ margin: "0.75rem 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Dashboard marketing
          </p>
        </div>
        <h1 style={{ margin: "0 0 1.25rem", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", textAlign: "center" }}>
          Accesso riservato
        </h1>
        <label htmlFor="pw" style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 500 }}>Password</label>
        <input id="pw" type="password" value={password}
          onChange={(e) => { setPassword(e.target.value); if (error) setError(false); }}
          autoFocus required
          style={{
            width: "100%", padding: "0.65rem 0.75rem",
            background: "rgba(255,255,255,0.06)",
            border: `1.5px solid ${error ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.14)"}`,
            borderRadius: 8, color: "#ffffff", fontSize: 14, outline: "none",
            boxSizing: "border-box", fontFamily: "inherit",
          }} />
        {error && <p style={{ color: "#f87171", fontSize: 12, margin: "0.5rem 0 0" }}>Password non corretta</p>}
        <button type="submit" disabled={!password} style={{
          width: "100%", marginTop: "1rem", padding: "0.7rem",
          background: !password ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAGE} 0%, #4a6650 100%)`,
          color: !password ? "rgba(255,255,255,0.4)" : "#ffffff",
          border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: !password ? "not-allowed" : "pointer",
          fontFamily: "inherit", letterSpacing: "-0.01em",
        }}>Accedi</button>
      </form>
    </div>
  );
}
