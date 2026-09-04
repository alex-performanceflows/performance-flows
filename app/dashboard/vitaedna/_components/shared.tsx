"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

// ─── Types ────────────────────────────────────────────────────────

export type BlendedWindow = {
  spend_meta: number;
  spend_gads: number;
  spend_total: number;
  platform_value: number;
  revenue_woo: number;
  orders_woo: number;
  mer: number;
  revenue_ga4: number;
  tracking_gap_pct: number;
};

export type WooTotals = { revenue: number; orders: number; aov: number };
export type Ga4Totals = { sessions: number; users: number; transactions: number; revenue: number };
export type CreativeSet = { label: string; days: number; rows: (string | number)[][] };

export type DashboardData = {
  updated_at?: string;
  blended?: { w30?: BlendedWindow; p30?: BlendedWindow };
  woo?: {
    totals?: { w7?: WooTotals; w30?: WooTotals; w90?: WooTotals; p30?: WooTotals };
    daily?: (string | number)[][];
    by_product?: (string | number)[][];
    coupons?: (string | number)[][];
  };
  ga4?: {
    channels?: { w7?: (string | number)[][]; w30?: (string | number)[][] };
    daily?: (string | number)[][];
    demo?: { age?: (string | number)[][]; gender?: (string | number)[][] };
    geo?: { country?: (string | number)[][]; region?: (string | number)[][] };
    devices?: (string | number)[][];
    totals?: { w30?: Ga4Totals; p30?: Ga4Totals };
  };
  meta?: {
    campaigns?: { w7?: (string | number)[][]; w30?: (string | number)[][]; p30?: (string | number)[][] };
    creatives?: { w7?: CreativeSet; w30?: CreativeSet; w90?: CreativeSet };
  };
  gads?: (string | number)[][];
  gsc?: {
    daily?: (string | number)[][];       // [data, click, impression, ctr_pct, posizione]
    queries_w30?: (string | number)[][]; // [query, click, impression, ctr_pct, posizione]
    pages_w30?: (string | number)[][];   // [pagina, click, impression, ctr_pct, posizione]
  };
};

// ─── Colors: kit palette (identico su entrambi i temi) ────────────

export const KIT_COLORS = {
  salute: "#64CBFF",
  dimagrimento: "#96C228",
  fitness: "#00978F",
  sport: "#EB9115",
  altri: "#94a3b8",
} as const;

export type KitKey = keyof typeof KIT_COLORS;

export const KITS: { key: KitKey; label: string; color: string; keywords: string[] }[] = [
  { key: "salute", label: "Salute", color: KIT_COLORS.salute, keywords: ["salute", "immun", "vitamin"] },
  { key: "dimagrimento", label: "Dimagrimento", color: KIT_COLORS.dimagrimento, keywords: ["dimagr", "brucia", "detox"] },
  { key: "fitness", label: "Fitness", color: KIT_COLORS.fitness, keywords: ["fitness", "muscol", "prote"] },
  { key: "sport", label: "Sport", color: KIT_COLORS.sport, keywords: ["sport", "energ", "perfor"] },
];

export function kitOf(name: string): KitKey {
  const n = (name || "").toLowerCase();
  for (const k of KITS) {
    if (k.keywords.some((w) => n.includes(w))) return k.key;
  }
  return "altri";
}

export const CHART_PALETTE = [
  "#64CBFF", "#96C228", "#00978F", "#EB9115",
  "#a78bfa", "#f472b6", "#f59e0b", "#38bdf8",
];

export const POSITIVE = "#22c55e";
export const NEGATIVE = "#ef4444";
export const NEUTRAL = "rgba(148,163,184,0.9)";

// ─── Theme system ─────────────────────────────────────────────────

export type Theme = "dark" | "light";

export type Palette = {
  shellBg: string;                // full-page background
  sidebarBg: string;
  sidebarBorder: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  divider: string;
  text: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  input: string;
  inputBorder: string;
  buttonHover: string;
  positive: string;
  negative: string;
  accent: string;
};

export const DARK_PALETTE: Palette = {
  shellBg: "radial-gradient(ellipse at top, #101a30 0%, #0a0f1e 55%, #06080f 100%)",
  sidebarBg: "rgba(6,8,15,0.65)",
  sidebarBorder: "rgba(255,255,255,0.06)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.10)",
  cardShadow: "0 4px 20px rgba(0,0,0,0.15)",
  divider: "rgba(255,255,255,0.08)",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.72)",
  textDim: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.35)",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(255,255,255,0.5)",
  tooltipBg: "rgba(6,8,15,0.95)",
  tooltipBorder: "rgba(255,255,255,0.15)",
  input: "rgba(255,255,255,0.06)",
  inputBorder: "rgba(255,255,255,0.14)",
  buttonHover: "rgba(255,255,255,0.10)",
  positive: POSITIVE,
  negative: NEGATIVE,
  accent: "#64CBFF",
};

export const LIGHT_PALETTE: Palette = {
  shellBg: "linear-gradient(180deg, #f0f6fc 0%, #f6fafd 60%, #ffffff 100%)",
  sidebarBg: "rgba(255,255,255,0.72)",
  sidebarBorder: "rgba(15,23,42,0.08)",
  cardBg: "#ffffff",
  cardBorder: "rgba(15,23,42,0.10)",
  cardShadow: "0 4px 18px rgba(15,23,42,0.06)",
  divider: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  textMuted: "rgba(15,23,42,0.72)",
  textDim: "rgba(15,23,42,0.55)",
  textFaint: "rgba(15,23,42,0.4)",
  grid: "rgba(15,23,42,0.08)",
  axis: "rgba(15,23,42,0.55)",
  tooltipBg: "rgba(255,255,255,0.98)",
  tooltipBorder: "rgba(15,23,42,0.15)",
  input: "#f1f5f9",
  inputBorder: "rgba(15,23,42,0.14)",
  buttonHover: "rgba(15,23,42,0.06)",
  positive: POSITIVE,
  negative: NEGATIVE,
  accent: "#0891b2",
};

export const ThemeContext = createContext<{
  theme: Theme;
  palette: Palette;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}>({
  theme: "light",
  palette: LIGHT_PALETTE,
  setTheme: () => {},
  toggle: () => {},
});

const THEME_KEY = "pf.vitaedna.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") setThemeState(stored);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme, hydrated]);

  const value = useMemo(() => ({
    theme,
    palette: theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE,
    setTheme: setThemeState,
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Formatters ────────────────────────────────────────────────────

const EUR_FMT = new Intl.NumberFormat("it-IT", {
  style: "currency", currency: "EUR",
  minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always",
});
const EUR0_FMT = new Intl.NumberFormat("it-IT", {
  style: "currency", currency: "EUR",
  minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: "always",
});
const INT_FMT = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });

export function eur(n: number | null | undefined): string {
  return EUR_FMT.format(n ?? 0);
}
export function eur0(n: number | null | undefined): string {
  return EUR0_FMT.format(n ?? 0);
}
export function integer(n: number | null | undefined): string {
  return INT_FMT.format(n ?? 0);
}
export function num(n: number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: "always",
  }).format(n ?? 0);
}
export function pctStr(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return `${num(n, digits)}%`;
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("it-IT", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}

// ─── Delta ────────────────────────────────────────────────────────

export type DeltaInfo = {
  pct: number;
  absPct: number;
  positive: boolean;
  zero: boolean;
  color: string;
  arrow: string;
  label: string;
};

// Inverte la logica del colore: usato per metriche in cui "in aumento" è peggio (es. posizione media SEO)
export function invertDeltaColor(d: DeltaInfo | null): DeltaInfo | null {
  if (!d || d.zero) return d;
  return { ...d, color: d.positive ? NEGATIVE : POSITIVE };
}

export function calcDelta(current: number | null | undefined, previous: number | null | undefined): DeltaInfo | null {
  if (current == null || previous == null) return null;
  if (!isFinite(current) || !isFinite(previous) || previous === 0) return null;
  const d = ((current - previous) / previous) * 100;
  const zero = Math.abs(d) < 0.05;
  const positive = d > 0;
  return {
    pct: d,
    absPct: Math.abs(d),
    positive,
    zero,
    color: zero ? NEUTRAL : positive ? POSITIVE : NEGATIVE,
    arrow: zero ? "—" : positive ? "▲" : "▼",
    label: zero ? "—" : `${positive ? "+" : "−"}${num(Math.abs(d), 1)}%`,
  };
}

// ─── UI Primitives (theme-aware) ──────────────────────────────────

export function Card({
  children, style, padding = 20, className,
}: { children: React.ReactNode; style?: React.CSSProperties; padding?: number; className?: string }) {
  const { palette } = useTheme();
  return (
    <div className={className} style={{
      background: palette.cardBg,
      border: `1px solid ${palette.cardBorder}`,
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderRadius: 14,
      padding,
      boxShadow: palette.cardShadow,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>
        {title}
      </h3>
      {right}
    </div>
  );
}

export function KpiTile({
  label, value, delta, accent, sub, info,
}: {
  label: string;
  value: string;
  delta?: DeltaInfo | null;
  accent?: string;
  sub?: string;
  info?: string;      // testo esplicativo mostrato su hover dell'icona (i)
}) {
  const { palette } = useTheme();
  return (
    <Card padding={18} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <p style={{
          margin: 0, fontSize: 10, fontWeight: 700,
          color: palette.textDim,
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>{label}</p>
        {info && (
          <span
            role="img"
            aria-label={`Info: ${info}`}
            title={info}
            style={{
              flexShrink: 0,
              width: 16, height: 16, borderRadius: "50%",
              border: `1px solid ${palette.cardBorder}`,
              background: palette.buttonHover,
              color: palette.textDim,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, fontFamily: "'Times New Roman', serif",
              fontStyle: "italic", lineHeight: 1,
              cursor: "help",
            }}
          >
            i
          </span>
        )}
      </div>
      <p style={{
        margin: "0.4rem 0 0",
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em",
        color: accent ?? palette.text,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</p>
      {(delta || sub) && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {delta && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: delta.color,
              display: "inline-flex", alignItems: "center", gap: 3,
            }}>
              <span aria-hidden style={{ fontSize: 10 }}>{delta.arrow}</span>
              {delta.label}
            </span>
          )}
          {sub && (
            <span style={{ fontSize: 11, color: palette.textDim }}>{sub}</span>
          )}
        </div>
      )}
    </Card>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  const { palette } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: palette.text }}>
        {children}
      </h2>
      {sub && (
        <p style={{ margin: "3px 0 0", fontSize: 12, color: palette.textDim }}>{sub}</p>
      )}
    </div>
  );
}

export function EmptyState({ label = "In attesa dei primi dati" }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <div style={{
      padding: "2rem 1rem",
      textAlign: "center",
      color: palette.textDim,
      fontSize: 13,
      fontStyle: "italic",
    }}>
      {label}
    </div>
  );
}

export function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const { palette } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.35rem 0.75rem",
        borderRadius: 20,
        border: `1px solid ${active ? palette.textFaint : palette.cardBorder}`,
        background: active ? palette.buttonHover : "transparent",
        color: active ? palette.text : palette.textMuted,
        fontSize: 12, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export function Skeleton({ width = "100%", height = 16, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  const { theme } = useTheme();
  const base = theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)";
  const mid = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)";
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: `linear-gradient(90deg, ${base} 0%, ${mid} 50%, ${base} 100%)`,
      backgroundSize: "200% 100%",
      animation: "pf-shimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

// Table styles come funzione (dipendono dal tema)
export function tableStyles(palette: Palette) {
  return {
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 12 },
    th: {
      padding: "0.55rem 0.65rem", textAlign: "left" as const,
      fontSize: 10, fontWeight: 700, color: palette.textDim,
      letterSpacing: "0.05em", textTransform: "uppercase" as const,
      borderBottom: `1px solid ${palette.divider}`, whiteSpace: "nowrap" as const,
    },
    thRight: { textAlign: "right" as const },
    tdBase: {
      padding: "0.55rem 0.65rem",
      color: palette.textMuted,
      borderBottom: `1px solid ${palette.cardBorder}`,
      fontVariantNumeric: "tabular-nums" as const,
    },
    tdRight: { textAlign: "right" as const },
  };
}
