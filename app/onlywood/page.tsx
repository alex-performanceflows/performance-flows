"use client";

import { useMemo } from "react";
import { useState } from "react";

const SCENARIOS = [
  { label: "Bassa stagione", rev: 15000 },
  { label: "Mese medio", rev: 30000 },
  { label: "Marzo 2026", rev: 42310, isCurrent: true },
  { label: "Estate (est.)", rev: 65000 },
  { label: "Obiettivo annuo ÷ 12", rev: 85000 },
  { label: "Scenario top", rev: 110000 },
];

const BENCHMARK = 1800;

function fmtEur(v: number) {
  return "€\u00a0" + Math.round(v).toLocaleString("it-IT");
}
function fmtPct(v: number) {
  return v.toFixed(1).replace(".", ",") + "%";
}

export default function OnlywoodPage() {
  const [revenue, setRevenue] = useState(42000);
  const [pct, setPct] = useState(2.5);
  const [fixed, setFixed] = useState(1000);

  const calc = useMemo(() => {
    const variable = revenue * (pct / 100);
    const total = fixed + variable;
    const diff = total - BENCHMARK;
    const varPct = (variable / total) * 100;
    const feeOfRev = ((total / revenue) * 100);
    return { variable, total, diff, varPct, feeOfRev };
  }, [revenue, pct, fixed]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        .ow-root { font-family: 'DM Sans', sans-serif; background: #F7F4EF; color: #2A1F14; min-height: 100dvh; }
        .ow-serif { font-family: 'DM Serif Display', serif; }
        input[type=range].ow-slider { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #EDE4D3; outline: none; cursor: pointer; }
        input[type=range].ow-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #2A1F14; border: 3px solid #F7F4EF; box-shadow: 0 0 0 1px #2A1F14; transition: transform 0.15s; }
        input[type=range].ow-slider::-webkit-slider-thumb:hover, input[type=range].ow-slider:focus::-webkit-slider-thumb { transform: scale(1.2); }
        .ow-bar-fill { transition: width 0.4s cubic-bezier(.4,0,.2,1); }
      `}</style>

      <div className="ow-root">
        {/* Header */}
        <header style={{ background: "#2A1F14", padding: "2.5rem 2rem 2.25rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(107,158,106,0.12)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: "30%", width: 180, height: 180, borderRadius: "50%", background: "rgba(212,196,168,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#D4C4A8", opacity: 0.7, marginBottom: "0.5rem" }}>
              Performance Flows × OnlyWood
            </p>
            <h1 className="ow-serif" style={{ fontSize: "clamp(1.6rem, 5vw, 2.6rem)", color: "#F7F4EF", lineHeight: 1.15, maxWidth: 480 }}>
              Quanto costa far crescere{" "}
              <em style={{ fontStyle: "italic", color: "#6B9E6A" }}>l&apos;ecommerce?</em>
            </h1>
            <p style={{ marginTop: "0.75rem", fontSize: 13, color: "#D4C4A8", opacity: 0.75, fontWeight: 300, maxWidth: 400, lineHeight: 1.5 }}>
              Muovi i cursori per simulare la struttura di collaborazione in base al tuo fatturato online mensile.
            </p>
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem 5rem" }}>

          {/* Section label */}
          <SectionLabel>Le tue variabili</SectionLabel>

          {/* Sliders */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE4D3", padding: "1.5rem", marginBottom: "1rem" }}>
            {/* Revenue */}
            <SliderRow
              label="Vendite nette mensili (WooCommerce)"
              displayValue={fmtEur(revenue)}
              min={5000} max={120000} step={1000}
              value={revenue}
              onChange={setRevenue}
              rangeMin="€5k" rangeMax="€120k"
            />
            {/* Pct */}
            <SliderRow
              label="Percentuale sul fatturato netto"
              displayValue={fmtPct(pct)}
              min={1} max={4} step={0.5}
              value={pct}
              onChange={setPct}
              rangeMin="1%" rangeMax="4%"
            />
            {/* Fixed */}
            <SliderRow
              label="Quota fissa mensile"
              displayValue={fmtEur(fixed)}
              min={500} max={1500} step={100}
              value={fixed}
              onChange={setFixed}
              rangeMin="€500" rangeMax="€1.500"
              last
            />
          </div>

          {/* Section label */}
          <SectionLabel>Risultato</SectionLabel>

          {/* Results grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
            {/* Main result card */}
            <div style={{ gridColumn: "1 / -1", background: "#2A1F14", borderRadius: 12, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ fontSize: 11, color: "#D4C4A8", opacity: 0.7, marginBottom: 4 }}>Fee mensile totale</p>
                <p className="ow-serif" style={{ fontSize: "2.4rem", color: "#F7F4EF", lineHeight: 1 }}>
                  {fmtEur(calc.total)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, color: "#D4C4A8", opacity: 0.7, marginBottom: 4 }}>
                  Risparmio vs fee fissa €1.800
                </p>
                <p className="ow-serif" style={{ fontSize: "1.5rem", lineHeight: 1, color: calc.diff > 0 ? "#B85C38" : calc.diff < 0 ? "#3B6B3A" : "#D4C4A8" }}>
                  {calc.diff > 0 ? "+" + fmtEur(calc.diff) : calc.diff < 0 ? fmtEur(calc.diff) : "= pari"}
                </p>
                <p style={{ fontSize: 11, color: "#D4C4A8", opacity: 0.6, marginTop: 4 }}>
                  {calc.diff > 0 ? "più della fee fissa" : calc.diff < 0 ? "risparmio vs fee fissa" : ""}
                </p>
              </div>
            </div>

            {/* Fixed card */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE4D3", padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: 11, color: "#8C6E58", marginBottom: 4 }}>Quota fissa</p>
              <p className="ow-serif" style={{ fontSize: "1.7rem", color: "#2A1F14", lineHeight: 1 }}>{fmtEur(fixed)}</p>
              <p style={{ fontSize: 11, color: "#8C6E58", marginTop: 4 }}>indipendente dal fatturato</p>
            </div>

            {/* Variable card */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE4D3", padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: 11, color: "#8C6E58", marginBottom: 4 }}>Quota variabile</p>
              <p className="ow-serif" style={{ fontSize: "1.7rem", color: "#2A1F14", lineHeight: 1 }}>{fmtEur(calc.variable)}</p>
              <p style={{ fontSize: 11, color: "#8C6E58", marginTop: 4 }}>{fmtPct(pct)} × {fmtEur(revenue)}</p>
            </div>
          </div>

          {/* Breakdown bar */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE4D3", padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#4A3728" }}>Composizione della fee</span>
              <span style={{ fontSize: 11, color: "#8C6E58" }}>
                Fee = {calc.feeOfRev.toFixed(1).replace(".", ",")}% del fatturato
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#EDE4D3", overflow: "hidden", margin: "0.75rem 0" }}>
              <div
                className="ow-bar-fill"
                style={{ height: "100%", background: "#3B6B3A", borderRadius: 4, width: calc.varPct.toFixed(1) + "%" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8C6E58" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B6B3A", display: "inline-block" }} />
                Variabile
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4C4A8", display: "inline-block" }} />
                Fissa
              </span>
            </div>
          </div>

          {/* Scenarios */}
          <SectionLabel>Scenari mensili</SectionLabel>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE4D3", padding: "0 1.5rem", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Scenario", "Fatturato netto", "Fee totale", "Fee % sul fat."].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 0 8px", fontWeight: 500, fontSize: 11, color: "#8C6E58", borderBottom: "1px solid #EDE4D3" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => {
                  const sVar = s.rev * (pct / 100);
                  const sTotal = fixed + sVar;
                  const sPct = ((sTotal / s.rev) * 100).toFixed(1).replace(".", ",");
                  const isActive = Math.abs(s.rev - revenue) < 3000;
                  const isCheap = sTotal < BENCHMARK;
                  return (
                    <tr key={s.label}>
                      <td style={{ padding: "10px 0", borderBottom: "0.5px solid #EDE4D3", color: isActive ? "#2A1F14" : "#4A3728", fontWeight: isActive ? 500 : 400 }}>
                        {s.label}
                        {s.isCurrent && (
                          <span style={{ display: "inline-block", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "#EAF2E9", color: "#3B6B3A", fontWeight: 500, marginLeft: 6, verticalAlign: "middle" }}>
                            attuale
                          </span>
                        )}
                        {isActive && !s.isCurrent && (
                          <span style={{ display: "inline-block", fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "#EAF2E9", color: "#3B6B3A", fontWeight: 500, marginLeft: 6, verticalAlign: "middle" }}>
                            ↑ simulato
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 0", borderBottom: "0.5px solid #EDE4D3", textAlign: "right", fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: isActive ? "#3B6B3A" : "#4A3728" }}>{fmtEur(s.rev)}</td>
                      <td style={{ padding: "10px 0", borderBottom: "0.5px solid #EDE4D3", textAlign: "right", fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: isActive ? "#3B6B3A" : "#4A3728" }}>{fmtEur(sTotal)}</td>
                      <td style={{ padding: "10px 0", borderBottom: "0.5px solid #EDE4D3", textAlign: "right", fontFamily: "'DM Serif Display', serif", fontSize: "1.05rem", color: isActive ? "#3B6B3A" : "#4A3728" }}>{sPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div style={{ background: "#EAF2E9", borderLeft: "3px solid #3B6B3A", borderRadius: "0 8px 8px 0", padding: "0.875rem 1rem", fontSize: 12.5, color: "#4A3728", lineHeight: 1.6, marginTop: "1rem" }}>
            <strong style={{ fontWeight: 500, color: "#3B6B3A" }}>Come si legge questo calcolatore.</strong>{" "}
            La quota variabile è calcolata sulle <em>vendite nette</em> registrate su WooCommerce — cioè al netto di resi e coupon, esattamente come appaiono nel pannello. Nessuna stima: entrambi vedete lo stesso numero.
          </div>
        </main>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: "1.5rem", fontSize: 11, color: "#8C6E58", opacity: 0.6, borderTop: "0.5px solid #D4C4A8" }}>
          Performance Flows S.R.L. — simulatore indicativo, non contrattuale
        </footer>
      </div>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8C6E58", marginBottom: "1.25rem", marginTop: "2rem", display: "flex", alignItems: "center", gap: 8 }}>
      {children}
      <span style={{ flex: 1, height: 0.5, background: "#D4C4A8" }} />
    </div>
  );
}

function SliderRow({
  label, displayValue, min, max, step, value, onChange, rangeMin, rangeMax, last = false,
}: {
  label: string; displayValue: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; rangeMin: string; rangeMax: string; last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 0 : "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#4A3728" }}>{label}</span>
        <span className="ow-serif" style={{ fontSize: "1.4rem", color: "#2A1F14", transition: "color 0.2s" }}>{displayValue}</span>
      </div>
      <input
        type="range"
        className="ow-slider"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8C6E58", marginTop: 4 }}>
        <span>{rangeMin}</span>
        <span>{rangeMax}</span>
      </div>
    </div>
  );
}
