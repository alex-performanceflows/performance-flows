"use client";

import { useState } from "react";
import { ACCENT, BRAND_NAVY, CREAM } from "../config";

const CORRECT_PASSWORD = "momi";

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
      background: `radial-gradient(ellipse at top, ${BRAND_NAVY} 0%, #0f1226 55%, #0a0d1a 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "Inter, sans-serif", color: "#ffffff",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 360,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${ACCENT}40`,
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderRadius: 14, padding: "1.75rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/momi-white.png" alt="MOMI"
            style={{ display: "inline-block", height: 44, width: "auto", maxWidth: "70%" }} />
          <p style={{ margin: "0.6rem 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
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
          background: !password ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${ACCENT} 0%, #5d67c9 100%)`,
          color: !password ? "rgba(255,255,255,0.4)" : CREAM,
          border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
          cursor: !password ? "not-allowed" : "pointer",
          fontFamily: "inherit", letterSpacing: "-0.01em",
        }}>Accedi</button>
      </form>
    </div>
  );
}
