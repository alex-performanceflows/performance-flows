"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MomiData, fmtDateTime, fmtDate, Skeleton,
  ThemeProvider, useTheme,
  DateRangeProvider,
  NavContext, TabKey,
  type Palette,
} from "./shared";
import { ACCENT, BRAND_NAVY, CREAM } from "../config";
import { DateRangePicker } from "./DateRangePicker";
import { PanoramicaTab } from "./PanoramicaTab";
import { AdvertisingTab } from "./AdvertisingTab";
import { CreativitaTab } from "./CreativitaTab";
import { TrafficoTab } from "./TrafficoTab";
import { SEOTab } from "./SEOTab";
import { SaluteTab } from "./SaluteTab";

// Nota: Creatività è enfatizzata (badge accent)
const TABS: { key: TabKey; label: string; icon: React.ReactNode; primary?: boolean }[] = [
  { key: "panoramica", label: "Panoramica", icon: <IconOverview /> },
  { key: "advertising", label: "Advertising", icon: <IconAds /> },
  { key: "creativita", label: "Creatività", icon: <IconSpark />, primary: true },
  { key: "traffico", label: "Traffico", icon: <IconTraffic /> },
  { key: "seo", label: "SEO", icon: <IconSearch /> },
  { key: "salute", label: "Salute", icon: <IconHeart /> },
];

export function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  );
}

function DashboardInner() {
  const { theme, palette, toggle } = useTheme();
  const [data, setData] = useState<MomiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("panoramica");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/momi", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as MomiData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
      setData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const navCtx = useMemo(() => ({ setTab }), []);
  const isDark = theme === "dark";
  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";
  const ga4First = data?.health?.ga4_first_date ?? data?.ga4?.first_date;

  return (
    <NavContext.Provider value={navCtx}>
    <DateRangeProvider data={data}>
    <div data-theme={theme} style={{
      minHeight: "100dvh",
      background: isDark
        ? `radial-gradient(ellipse at top, ${BRAND_NAVY} 0%, #0f1226 55%, #0a0d1a 100%)`
        : palette.shellBg,
      color: palette.text, fontFamily: "Inter, sans-serif",
    }}>
      <div className="pf-shell">
        <aside className="pf-sidebar" style={{
          background: isDark ? `rgba(15,18,38,0.85)` : palette.sidebarBg,
          borderRight: `1px solid ${palette.sidebarBorder}`,
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        }}>
          <div style={{ padding: "1.5rem 1.25rem 1.75rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isDark ? "/logos/momi-white.png" : "/logos/momi.png"} alt="MOMI"
              style={{ height: 26, width: "auto", display: "block", marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: palette.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Dashboard marketing
            </p>
          </div>

          <nav style={{ padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {TABS.map((t) => (
              <SidebarLink key={t.key} active={tab === t.key} primary={t.primary}
                icon={t.icon} label={t.label}
                onClick={() => { setTab(t.key); setMobileNavOpen(false); }} />
            ))}
          </nav>

          <div style={{ padding: "0.85rem 1.25rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: palette.textDim, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Aggiornato
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={toggle} title={isDark ? "Tema chiaro" : "Tema scuro"} style={iconBtn(palette)}>
                  {isDark ? <IconSun /> : <IconMoon />}
                </button>
                <button onClick={() => window.print()} title="Stampa" style={iconBtn(palette)}>
                  <IconPrint />
                </button>
                <button onClick={load} disabled={loading} title="Aggiorna"
                  style={{ ...iconBtn(palette), cursor: loading ? "wait" : "pointer", opacity: loading ? 0.5 : 1 }}>
                  <IconRefresh />
                </button>
              </div>
            </div>
            <div style={{ color: palette.textMuted, fontSize: 11, lineHeight: 1.4 }}>
              {loading && !data ? <Skeleton width={120} height={11} /> : data?.updated_at ? fmtDateTime(data.updated_at) : "—"}
            </div>
            {ga4First && (
              <div style={{ marginTop: 6, fontSize: 10, color: palette.textDim, lineHeight: 1.35 }}>
                Dati GA4 dal <strong style={{ color: palette.textMuted }}>{fmtDate(ga4First)}</strong>
              </div>
            )}
            <p style={{ margin: "0.9rem 0 0", fontSize: 10, color: palette.textFaint }}>Performance Flows</p>
          </div>
        </aside>

        {/* Mobile bar */}
        <div className="pf-mobile-bar" style={{
          background: isDark ? `rgba(15,18,38,0.9)` : palette.sidebarBg,
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${palette.divider}`,
          padding: "0.8rem 1rem", display: "none",
          alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={isDark ? "/logos/momi-white.png" : "/logos/momi.png"} alt="MOMI"
              style={{ height: 20, width: "auto", display: "block" }} />
            <span style={{ fontSize: 12, color: palette.textDim, paddingLeft: 10, borderLeft: `1px solid ${palette.divider}` }}>
              {activeLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={toggle} title="Tema" style={iconBtn(palette)}>{isDark ? <IconSun /> : <IconMoon />}</button>
            <button onClick={() => setMobileNavOpen((v) => !v)} title="Menu" style={iconBtn(palette)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="pf-mobile-menu" style={{
            display: "none", background: isDark ? `rgba(15,18,38,0.95)` : palette.sidebarBg,
            borderBottom: `1px solid ${palette.divider}`, padding: "0.75rem",
            position: "sticky", top: 62, zIndex: 39,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {TABS.map((t) => (
                <SidebarLink key={t.key} active={tab === t.key} primary={t.primary}
                  icon={t.icon} label={t.label}
                  onClick={() => { setTab(t.key); setMobileNavOpen(false); }} />
              ))}
            </div>
          </div>
        )}

        <main className="pf-main">
          <div className="pf-noprint" style={{ marginBottom: 18 }}>
            <div style={{
              display: "flex", justifyContent: "flex-end", alignItems: "center",
              gap: 12, flexWrap: "wrap",
            }}>
              <DateRangePicker />
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)",
              color: isDark ? "#fecaca" : "#991b1b",
              padding: "1rem 1.25rem", borderRadius: 12, marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              <div>
                <strong style={{ color: isDark ? "#f87171" : "#b91c1c" }}>Errore:</strong>{" "}
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
              <button onClick={load} style={{
                padding: "0.5rem 1rem", borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.15)",
                color: isDark ? "#ffffff" : "#7f1d1d",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>Riprova</button>
            </div>
          )}

          {loading && !data && <SkeletonPage />}

          {data && (
            <>
              {tab === "panoramica" && <PanoramicaTab data={data} />}
              {tab === "advertising" && <AdvertisingTab data={data} />}
              {tab === "creativita" && <CreativitaTab data={data} />}
              {tab === "traffico" && <TrafficoTab data={data} />}
              {tab === "seo" && <SEOTab data={data} />}
              {tab === "salute" && <SaluteTab data={data} />}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes pf-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        html, body {
          background: ${isDark ? "#0a0d1a" : "#f6f4ff"};
          transition: background 0.25s;
        }
        .pf-shell {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100dvh;
          max-width: 1600px;
          margin: 0 auto;
        }
        .pf-sidebar {
          position: sticky; top: 0; height: 100dvh;
          display: flex; flex-direction: column; overflow-y: auto;
        }
        .pf-main { padding: 1.75rem 2rem 3rem; min-width: 0; }
        @media (max-width: 900px) {
          .pf-shell { display: block; }
          .pf-sidebar { display: none; }
          .pf-mobile-bar { display: flex !important; }
          .pf-mobile-menu { display: block !important; }
          .pf-main { padding: 1rem; }
        }
        @media (max-width: 640px) {
          .pf-daterange-popover { grid-template-columns: 1fr !important; }
        }
        @media print {
          .pf-noprint { display: none !important; }
          .pf-sidebar { display: none !important; }
          .pf-shell { display: block !important; grid-template-columns: 1fr !important; }
          .pf-main { padding: 0.5rem !important; }
          html, body { background: #ffffff !important; color: #0f172a !important; }
          * { background: transparent !important; color: #0f172a !important; box-shadow: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
    </DateRangeProvider>
    </NavContext.Provider>
  );
}

function SidebarLink({ active, primary, icon, label, onClick }: {
  active: boolean; primary?: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  const { palette } = useTheme();
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "0.7rem 0.85rem", borderRadius: 9, border: "none",
      background: active ? palette.buttonHover : "transparent",
      color: active ? palette.text : palette.textMuted,
      fontSize: primary ? 14 : 13, fontWeight: primary ? 700 : (active ? 600 : 500),
      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
      letterSpacing: "-0.01em", transition: "all 0.15s", position: "relative",
    }}>
      {active && (
        <span style={{
          position: "absolute", left: -12, top: "50%",
          transform: "translateY(-50%)",
          width: 3, height: 20, borderRadius: 2,
          background: `linear-gradient(180deg, ${ACCENT} 0%, ${CREAM} 100%)`,
        }} />
      )}
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: active || primary ? ACCENT : palette.textDim,
      }}>{icon}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {label}
        {primary && <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />}
      </span>
    </button>
  );
}

function IconOverview() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>; }
function IconAds() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 11-5.8-1.6" /></svg>; }
function IconSpark() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" /></svg>; }
function IconTraffic() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }
function IconSearch() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconHeart() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>; }
function IconRefresh() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>; }
function IconSun() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>; }
function IconMoon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>; }
function IconPrint() { return <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>; }

function iconBtn(palette: Palette): React.CSSProperties {
  return {
    width: 26, height: 26, borderRadius: 6,
    border: `1px solid ${palette.inputBorder}`,
    background: palette.input, color: palette.textMuted,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0, fontFamily: "inherit",
  };
}

function SkeletonPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton width={200} height={22} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 12, padding: 14 }}>
            <Skeleton width="70%" height={9} /><div style={{ height: 8 }} />
            <Skeleton width="80%" height={18} /><div style={{ height: 6 }} />
            <Skeleton width="40%" height={9} />
          </div>
        ))}
      </div>
      <Skeleton height={320} style={{ borderRadius: 14 }} />
    </div>
  );
}
