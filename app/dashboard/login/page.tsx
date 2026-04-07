"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(from);
      } else {
        const { error } = await res.json();
        setError(error ?? "Errore");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <span style={{ color: "#18181b", fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}>Performance Flows</span>
          </div>
          <p style={{ color: "#71717a", fontSize: 13 }}>Dashboard interna</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, padding: "1.75rem" }}>
          <h1 style={{ color: "#18181b", fontSize: 18, fontWeight: 600, marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>Accedi</h1>
          <p style={{ color: "#71717a", fontSize: 13, marginBottom: "1.5rem" }}>Inserisci la password per continuare</p>

          <label style={{ display: "block", fontSize: 12, color: "#52525b", marginBottom: "0.4rem", fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
            required
            style={{
              width: "100%", padding: "0.625rem 0.75rem", background: "#f4f4f5",
              border: `1px solid ${error ? "#ef4444" : "#d4d4d8"}`, borderRadius: 8,
              color: "#18181b", fontSize: 14, outline: "none", boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />

          {error && (
            <p style={{ color: "#ef4444", fontSize: 12, marginTop: "0.5rem" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", marginTop: "1rem", padding: "0.625rem",
              background: loading || !password ? "#e4e4e7" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: loading || !password ? "#a1a1aa" : "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
