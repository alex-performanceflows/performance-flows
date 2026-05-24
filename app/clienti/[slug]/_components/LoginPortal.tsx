"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function LoginPortal({
  slug,
  clientName,
}: {
  slug: string;
  clientName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clienti/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Errore");
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#f7f6f4",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      padding: "1rem",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Image
            src="/images/logo-color.webp"
            alt="Performance Flows"
            width={388}
            height={156}
            priority
            style={{ height: 56, width: "auto", display: "inline-block", marginBottom: 10 }}
          />
          {clientName && (
            <p style={{ color: "#5c5f6e", fontSize: 14, marginTop: 4 }}>
              Portale di <strong style={{ color: "#0d0e1f" }}>{clientName}</strong>
            </p>
          )}
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#ffffff",
            border: "1px solid #e2e0dc",
            borderRadius: 14,
            padding: "1.75rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <h1 style={{ color: "#0d0e1f", fontSize: 19, fontWeight: 600, marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>
            Accedi al portale
          </h1>
          <p style={{ color: "#5c5f6e", fontSize: 13, marginBottom: "1.5rem" }}>
            Inserisci la password che ti abbiamo fornito
          </p>

          <label style={{ display: "block", fontSize: 12, color: "#5c5f6e", marginBottom: "0.4rem", fontWeight: 500 }}>
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
              width: "100%",
              padding: "0.65rem 0.75rem",
              background: "#f7f6f4",
              border: `1.5px solid ${error ? "#ef4444" : "#dcdad7"}`,
              borderRadius: 8,
              color: "#0d0e1f",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
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
              width: "100%",
              marginTop: "1rem",
              padding: "0.7rem",
              background: loading || !password ? "#e2e0dc" : "#1a2580",
              color: loading || !password ? "#9c9a97" : "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9c9a97", marginTop: "1.25rem" }}>
          Hai problemi di accesso?{" "}
          <a
            href="mailto:alex@performanceflows.com"
            style={{ color: "#1a2580", textDecoration: "none", fontWeight: 500 }}
          >
            Contattaci
          </a>
        </p>
      </div>
    </div>
  );
}
