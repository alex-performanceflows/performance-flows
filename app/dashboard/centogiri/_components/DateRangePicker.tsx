"use client";

import { useEffect, useRef, useState } from "react";
import {
  useDateRange, useTheme,
  PRESET_LABEL, PRESET_LABEL_SHORT, COMPARE_LABEL,
  RangePreset, ComparisonMode,
  fmtDate, daysBetween,
} from "./shared";

const PRESETS: RangePreset[] = ["w7", "w30", "w90", "mtd", "last_month", "ytd", "custom"];

export function DateRangePicker() {
  const { palette } = useTheme();
  const { preset, compare, range, compareRange, coverage, setPreset, setCompare, setCustomRange } =
    useDateRange();

  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(range.start);
  const [customEnd, setCustomEnd] = useState(range.end);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preset === "custom") {
      setCustomStart(range.start);
      setCustomEnd(range.end);
    }
  }, [preset, range.start, range.end]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const minDate = coverage?.min;
  const maxDate = coverage?.max;

  const rangeLabelText =
    preset === "custom"
      ? `${fmtDate(range.start)} – ${fmtDate(range.end)}`
      : `${PRESET_LABEL[preset]} (${fmtDate(range.start)} – ${fmtDate(range.end)})`;

  const compareText = compareRange
    ? `${COMPARE_LABEL[compare]} (${fmtDate(compareRange.start)} – ${fmtDate(compareRange.end)})`
    : "nessuna comparazione";

  function applyCustom() {
    if (!customStart || !customEnd) return;
    if (customStart > customEnd) return;
    setCustomRange({ start: customStart, end: customEnd, days: daysBetween(customStart, customEnd) });
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "0.55rem 0.85rem", borderRadius: 10,
          border: `1px solid ${palette.inputBorder}`,
          background: palette.cardBg, color: palette.text,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: palette.cardShadow,
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{rangeLabelText}</span>
        <span style={{ color: palette.textDim, fontWeight: 500 }}>· {compareText}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ marginLeft: 2, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="pf-noprint pf-daterange-popover"
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 60,
            width: "min(480px, calc(100vw - 32px))",
            background: palette.cardBg,
            border: `1px solid ${palette.cardBorder}`,
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.20)",
            padding: "1rem",
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: 14,
          }}
        >
          {/* Preset list */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Intervallo
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPreset(p); if (p !== "custom") setOpen(false); }}
                  style={{
                    padding: "0.45rem 0.6rem", borderRadius: 7,
                    border: "none",
                    background: preset === p ? palette.buttonHover : "transparent",
                    color: preset === p ? palette.text : palette.textMuted,
                    fontSize: 12, fontWeight: preset === p ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}
                >
                  {PRESET_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Right: custom range + compare */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Personalizzato
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="date"
                  value={customStart}
                  min={minDate} max={customEnd || maxDate}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={dateInputStyle(palette)}
                />
                <span style={{ color: palette.textDim, fontSize: 12 }}>→</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart || minDate} max={maxDate}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={dateInputStyle(palette)}
                />
                <button
                  onClick={applyCustom}
                  style={{
                    padding: "0.45rem 0.85rem", borderRadius: 7,
                    border: "none", background: palette.text, color: palette.cardBg,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Applica
                </button>
              </div>
              {coverage && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: palette.textDim }}>
                  Dati disponibili: {fmtDate(coverage.min)} – {fmtDate(coverage.max)}
                </p>
              )}
            </div>

            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: palette.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Comparazione
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["prev", "yoy", "none"] as ComparisonMode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCompare(c)}
                    style={{
                      padding: "0.4rem 0.75rem", borderRadius: 20,
                      border: `1px solid ${compare === c ? palette.text : palette.cardBorder}`,
                      background: compare === c ? palette.buttonHover : "transparent",
                      color: compare === c ? palette.text : palette.textMuted,
                      fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {COMPARE_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function dateInputStyle(palette: { input: string; inputBorder: string; text: string }): React.CSSProperties {
  return {
    padding: "0.4rem 0.55rem",
    border: `1px solid ${palette.inputBorder}`,
    borderRadius: 7,
    background: palette.input,
    color: palette.text,
    fontSize: 12, fontFamily: "inherit",
  };
}

export function CompactRangeSwitch() {
  const { palette } = useTheme();
  const { preset, setPreset } = useDateRange();
  return (
    <div style={{
      display: "flex", gap: 3,
      background: palette.input,
      border: `1px solid ${palette.inputBorder}`,
      borderRadius: 8, padding: 3,
    }}>
      {(["w7", "w30", "w90"] as RangePreset[]).map((p) => (
        <button
          key={p}
          onClick={() => setPreset(p)}
          style={{
            padding: "0.3rem 0.55rem", borderRadius: 6, border: "none",
            background: preset === p ? palette.cardBg : "transparent",
            color: preset === p ? palette.text : palette.textDim,
            fontSize: 11, fontWeight: preset === p ? 700 : 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {PRESET_LABEL_SHORT[p]}
        </button>
      ))}
    </div>
  );
}
