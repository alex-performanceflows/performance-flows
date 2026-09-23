"use client";

import React, { useMemo, useState } from "react";
import { MAPPA_VIEWBOX, MAPPA_RESTO, MAPPA_PAESI, ISO2_NOTI } from "@/lib/world-map-paths";
import { iso2Da3 } from "@/lib/iso3166";
import { useTheme, type Palette } from "./shared";

// ─── Nomi dei paesi ───────────────────────────────────────────────
// Le piattaforme parlano lingue diverse: Meta manda il codice ISO ("US"),
// GA4 manda il nome inglese ("United States"). Intl fa da dizionario in
// tutte e due le direzioni, senza tabelle scritte a mano.

const nomeIT = typeof Intl !== "undefined" ? new Intl.DisplayNames(["it"], { type: "region" }) : null;
const nomeEN = typeof Intl !== "undefined" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

/** Nome italiano di un codice ISO-2. Se il codice non esiste, torna il codice. */
export function paeseLabel(iso: string): string {
  if (!iso) return "—";
  try { return nomeIT?.of(iso.toUpperCase()) ?? iso; } catch { return iso; }
}

/**
 * Sigle tenute in vita da ISO come sinonimo del codice attuale. ISO2_NOTI le
 * esclude già, ma una piattaforma può sempre mandarne una: qui si riportano
 * sul codice vero, altrimenti finirebbero fuori dalla mappa.
 */
const SINONIMI: Record<string, string> = {
  UK: "GB", FX: "FR", DD: "DE", EL: "GR", AN: "CW", SU: "RU", CS: "RS", YU: "RS", ZR: "CD",
  BU: "MM", DY: "BJ", HV: "BF", NH: "VU", RH: "ZW", TP: "TL", VD: "VN", YD: "YE",
};

const DA_NOME: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const c of ISO2_NOTI) {
    for (const dn of [nomeEN, nomeIT]) {
      try {
        const n = dn?.of(c);
        const k = n && n !== c ? normalizza(n) : null;
        if (k && !m.has(k)) m.set(k, c);
      } catch { /* codice non riconosciuto: si salta */ }
    }
  }
  // Forme che GA4 usa e Intl no
  for (const [nome, iso] of [
    ["united states of america", "US"], ["usa", "US"], ["uk", "GB"],
    ["great britain", "GB"], ["south korea", "KR"], ["north korea", "KP"],
    ["czech republic", "CZ"], ["ivory coast", "CI"], ["vatican city", "VA"],
    ["hong kong sar china", "HK"], ["macao sar china", "MO"], ["myanmar burma", "MM"],
  ] as const) m.set(nome, iso);
  return m;
})();

function normalizza(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").trim();
}

/**
 * Codice ISO-2 da quello che manda la piattaforma: un alpha-2 ("US"), un
 * alpha-3 come quelli di Search Console ("usa") o un nome ("United States").
 * Stringa vuota se non si riconosce.
 */
export function isoDaNome(nome: string): string {
  if (!nome) return "";
  const n = nome.trim();
  if (/^[A-Za-z]{2}$/.test(n)) {
    const c = n.toUpperCase();
    return SINONIMI[c] ?? c;
  }
  if (/^[A-Za-z]{3}$/.test(n)) return iso2Da3(n);
  return DA_NOME.get(normalizza(n)) ?? "";
}

// ─── Scala di colore ──────────────────────────────────────────────

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

/** Un solo colore schiarito verso il fondo: scala sequenziale, non arcobaleno. */
function versoFondo(base: [number, number, number], fondo: [number, number, number], q: number): string {
  const c = base.map((b, i) => Math.round(b * (1 - q) + fondo[i] * q));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const MISCELE = [0.78, 0.6, 0.4, 0.2, 0];

/** Proporzione della viewBox, per far seguire l'altezza alla larghezza. */
const PROPORZIONE = (() => {
  const [, , w, h] = MAPPA_VIEWBOX.split(/\s+/).map(Number);
  return w > 0 && h > 0 ? `${w} / ${h}` : "2 / 1";
})();

/**
 * Soglie per quantile invece che a intervalli uguali: con un paese che si
 * prende l'80% della spesa, gli intervalli uguali colorerebbero tutti gli
 * altri con la stessa tinta più chiara e la mappa non direbbe niente.
 */
function soglie(valori: number[], n: number): number[] {
  const ord = valori.filter((v) => v > 0).sort((a, b) => a - b);
  if (ord.length === 0) return [];
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    const idx = Math.min(ord.length - 1, Math.ceil((ord.length * i) / n) - 1);
    const v = ord[idx];
    if (out[out.length - 1] !== v) out.push(v);
  }
  return out;
}

export type MapRow = {
  iso: string;
  value: number;
  /** Righe della targhetta al passaggio del mouse. */
  detail?: { label: string; value: string }[];
};

export function WorldMap({
  rows, color, format, titolo, altezza = 380,
}: {
  rows: MapRow[];
  color: string;
  format: (v: number) => string;
  titolo?: string;
  altezza?: number;
}) {
  const { palette, theme } = useTheme();
  const [hover, setHover] = useState<{ iso: string; x: number; y: number } | null>(null);

  const base = useMemo(() => rgb(color), [color]);
  const fondo = useMemo<[number, number, number]>(
    () => (theme === "dark" ? [12, 17, 30] : [248, 249, 251]),
    [theme],
  );

  const perIso = useMemo(() => {
    const m = new Map<string, MapRow>();
    for (const r of rows) if (r.iso) m.set(r.iso.toUpperCase(), r);
    return m;
  }, [rows]);

  const livelli = useMemo(() => soglie(rows.map((r) => r.value), MISCELE.length), [rows]);
  const scala = useMemo(
    () => MISCELE.slice(MISCELE.length - livelli.length).map((q) => versoFondo(base, fondo, q)),
    [base, fondo, livelli.length],
  );

  function coloreDi(v: number): string | null {
    if (!(v > 0) || livelli.length === 0) return null;
    for (let i = 0; i < livelli.length; i++) if (v <= livelli[i]) return scala[i];
    return scala[scala.length - 1];
  }

  const terra = theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)";
  const bordo = theme === "dark" ? "rgba(6,8,15,0.9)" : "rgba(255,255,255,0.95)";

  const senzaMappa = rows.filter((r) => r.value > 0 && !MAPPA_PAESI[r.iso?.toUpperCase() ?? ""]);
  const riga = hover ? perIso.get(hover.iso) : null;

  return (
    <div style={{ position: "relative" }}>
      {titolo && (
        <div style={{ fontSize: 11, color: palette.textDim, marginBottom: 6, fontWeight: 600 }}>{titolo}</div>
      )}
      {/* L'altezza segue la larghezza: su telefono un box fisso lascerebbe
          mezzo schermo vuoto sopra e sotto il planisfero. */}
      <div style={{ position: "relative", width: "100%", aspectRatio: PROPORZIONE, maxHeight: altezza }}>
        <svg
          viewBox={MAPPA_VIEWBOX}
          width="100%" height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
          onMouseLeave={() => setHover(null)}
        >
          {MAPPA_RESTO && <path d={MAPPA_RESTO} fill={terra} stroke={bordo} strokeWidth={0.6} />}
          {Object.entries(MAPPA_PAESI).map(([iso, d]) => {
            const r = perIso.get(iso);
            const c = r ? coloreDi(r.value) : null;
            const attivo = hover?.iso === iso;
            return (
              <path
                key={iso} d={d}
                fill={c ?? terra}
                stroke={attivo ? palette.text : bordo}
                strokeWidth={attivo ? 1.2 : 0.6}
                style={{ cursor: c ? "pointer" : "default", transition: "fill 120ms" }}
                onMouseMove={(e) => {
                  if (!c) { setHover(null); return; }
                  const box = (e.currentTarget.ownerSVGElement?.parentElement as HTMLElement)?.getBoundingClientRect();
                  if (!box) return;
                  setHover({ iso, x: e.clientX - box.left, y: e.clientY - box.top });
                }}
              >
                <title>{`${paeseLabel(iso)}${r ? ` · ${format(r.value)}` : ""}`}</title>
              </path>
            );
          })}
        </svg>

        {hover && riga && (
          <div style={{
            position: "absolute", left: hover.x, top: hover.y,
            // Vicino al bordo alto la targhetta coprirebbe i comandi: scende sotto
            transform: hover.y < 140 ? "translate(-50%, 16px)" : "translate(-50%, calc(-100% - 12px))",
            background: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 8, padding: "0.5rem 0.7rem", pointerEvents: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 5, minWidth: 150,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: palette.text, marginBottom: 4 }}>
              {paeseLabel(hover.iso)}
            </div>
            {(riga.detail ?? [{ label: "Valore", value: format(riga.value) }]).map((d) => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 11 }}>
                <span style={{ color: palette.textDim }}>{d.label}</span>
                <span style={{ color: palette.text, fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Legenda livelli={livelli} scala={scala} format={format} palette={palette} terra={terra} />

      {senzaMappa.length > 0 && (
        <div style={{ fontSize: 10, color: palette.textFaint, marginTop: 6 }}>
          Fuori mappa: {senzaMappa.map((r) => r.iso || "?").join(", ")}
        </div>
      )}
    </div>
  );
}

function Legenda({
  livelli, scala, format, palette, terra,
}: {
  livelli: number[]; scala: string[]; format: (v: number) => string; palette: Palette; terra: string;
}) {
  if (livelli.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
      <span style={{ fontSize: 10, color: palette.textFaint, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
        Scala
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 14, height: 10, borderRadius: 2, background: terra, display: "inline-block" }} />
        <span style={{ fontSize: 10, color: palette.textDim }}>nessun dato</span>
      </span>
      {livelli.map((v, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 10, borderRadius: 2, background: scala[i], display: "inline-block" }} />
          <span style={{ fontSize: 10, color: palette.textDim }}>
            {i === 0 ? `fino a ${format(v)}` : `≤ ${format(v)}`}
          </span>
        </span>
      ))}
    </div>
  );
}
