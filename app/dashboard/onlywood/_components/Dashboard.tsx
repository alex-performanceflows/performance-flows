"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OnlywoodData, fmtDateTime, fmtDate, Skeleton,
  ThemeProvider, useTheme,
  DateRangeProvider, StoreProvider, useStore,
  NavContext, TabKey,
  type Palette,
} from "./shared";
import { ACCENT, BRAND_DARK, CREAM, WOOD } from "../config";
import { Logo } from "./Logo";
import { DateRangePicker } from "./DateRangePicker";
import { PanoramicaTab } from "./PanoramicaTab";
import { ProdottiTab } from "./ProdottiTab";
import { CategorieTab } from "./CategorieTab";
import { FunnelTab } from "./FunnelTab";
import { SpedizioniTab } from "./SpedizioniTab";
import { ClientiTab } from "./ClientiTab";
import { AdvertisingTab } from "./AdvertisingTab";
import { CreativitaTab } from "./CreativitaTab";
import { SEOTab } from "./SEOTab";
import { SaluteTab } from "./SaluteTab";
import { RoadmapTab } from "./RoadmapTab";
import { MeetingsTab } from "./MeetingsTab";

type TabDef = { key: TabKey; label: string; icon: React.ReactNode; primary?: boolean };

const GROUPS: { titolo: string; tabs: TabDef[] }[] = [
  {
    titolo: "Negozio",
    tabs: [
      { key: "panoramica", label: "Panoramica", icon: <IconOverview /> },
      { key: "prodotti", label: "Prodotti", icon: <IconBox />, primary: true },
      { key: "categorie", label: "Categorie", icon: <IconGrid /> },
      { key: "funnel", label: "Percorso d'acquisto", icon: <IconFunnel /> },
      { key: "spedizioni", label: "Spedizioni e resi", icon: <IconTruck /> },
      { key: "clienti", label: "Clienti e ordini", icon: <IconUsers /> },
    ],
  },
  {
    titolo: "Acquisizione",
    tabs: [
      { key: "advertising", label: "Advertising", icon: <IconAds /> },
      { key: "creativita", label: "Creatività", icon: <IconSpark /> },
      { key: "seo", label: "SEO", icon: <IconSearch /> },
    ],
  },
  {
    titolo: "Progetto",
    tabs: [
      { key: "roadmap", label: "Roadmap strategica", icon: <IconRoadmap /> },
      { key: "meetings", label: "Meetings", icon: <IconMeetings /> },
      { key: "salute", label: "Salute dei dati", icon: <IconHeart /> },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap((g) => g.tabs);

// Le viste da Notion non dipendono né dal motore né dal periodo
const NOTION_TABS: TabKey[] = ["roadmap", "meetings"];
// Sezioni che vivono di dati WooCommerce
const STORE_TABS: TabKey[] = ["panoramica", "prodotti", "categorie", "funnel", "spedizioni", "clienti", "salute"];

export function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  );
}

function DashboardInner() {
  const { theme, palette, toggle } = useTheme();
  const [data, setData] = useState<OnlywoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("panoramica");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/onlywood", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as OnlywoodData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
      setData(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cambiando sezione si riparte dall'alto: le tabelle qui sono lunghe
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const navCtx = useMemo(() => ({ setTab }), []);
  const isDark = theme === "dark";
  const isNotionTab = NOTION_TABS.includes(tab);
  const activeLabel = ALL_TABS.find((t) => t.key === tab)?.label ?? "";
  const ga4First = data?.health?.ga4_prima_data ?? data?.ga4?.first_date;

  return (
    <NavContext.Provider value={navCtx}>
    <DateRangeProvider data={data}>
    <StoreProvider enabled={!loading}>
    <div data-theme={theme} style={{
      minHeight: "100dvh",
      background: isDark
        ? `radial-gradient(ellipse at top, ${BRAND_DARK} 0%, #0b130e 55%, #080d0a 100%)`
        : palette.shellBg,
      color: palette.text, fontFamily: "Inter, sans-serif",
    }}>
      <div className="pf-shell">
        <aside className="pf-sidebar" style={{
          background: isDark ? "rgba(11,19,14,0.85)" : palette.sidebarBg,
          borderRight: `1px solid ${palette.sidebarBorder}`,
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        }}>
          <div style={{ padding: "1.5rem 1.25rem 1.5rem" }}>
            <Logo height={40} />
            <p style={{ margin: "0.5rem 0 0", fontSize: 10, fontWeight: 700, color: palette.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Dashboard marketing
            </p>
          </div>

          <nav style={{ padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            <NavGroups tab={tab} onPick={(t) => { setTab(t); setMobileNavOpen(false); }} />
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
                <ReloadButton engineLoading={loading} onEngineReload={load} />
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

        {/* Barra mobile */}
        <div className="pf-mobile-bar" style={{
          background: isDark ? "rgba(11,19,14,0.92)" : palette.sidebarBg,
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${palette.divider}`,
          padding: "0.8rem 1rem", display: "none",
          alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo height={26} />
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
            display: "none", background: isDark ? "rgba(11,19,14,0.96)" : palette.sidebarBg,
            borderBottom: `1px solid ${palette.divider}`, padding: "0.75rem",
            position: "sticky", top: 62, zIndex: 39,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <NavGroups tab={tab} onPick={(t) => { setTab(t); setMobileNavOpen(false); }} />
            </div>
          </div>
        )}

        <main className="pf-main">
          {!isNotionTab && (
            <div className="pf-noprint" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <StoreStatus active={STORE_TABS.includes(tab)} />
                <DateRangePicker />
              </div>
            </div>
          )}

          {error && !isNotionTab && (
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

          {loading && !data && !isNotionTab && <SkeletonPage />}

          {tab === "roadmap" && <RoadmapTab />}
          {tab === "meetings" && <MeetingsTab />}

          {data && (
            <>
              {tab === "panoramica" && <PanoramicaTab data={data} />}
              {tab === "prodotti" && <ProdottiTab data={data} />}
              {tab === "categorie" && <CategorieTab data={data} />}
              {tab === "funnel" && <FunnelTab data={data} />}
              {tab === "spedizioni" && <SpedizioniTab />}
              {tab === "clienti" && <ClientiTab />}
              {tab === "advertising" && <AdvertisingTab data={data} />}
              {tab === "creativita" && <CreativitaTab data={data} />}
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
        @keyframes pf-spin { to { transform: rotate(360deg); } }
        html, body {
          background: ${isDark ? "#080d0a" : "#f4f8f3"};
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
    </StoreProvider>
    </DateRangeProvider>
    </NavContext.Provider>
  );
}

function NavGroups({ tab, onPick }: { tab: TabKey; onPick: (t: TabKey) => void }) {
  const { palette } = useTheme();
  return (
    <>
      {GROUPS.map((g, i) => (
        <div key={g.titolo} style={{ marginTop: i === 0 ? 0 : 14 }}>
          <p style={{
            margin: "0 0 4px 0.85rem", fontSize: 9, fontWeight: 700,
            color: palette.textFaint, letterSpacing: "0.12em", textTransform: "uppercase",
          }}>{g.titolo}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {g.tabs.map((t) => (
              <SidebarLink key={t.key} active={tab === t.key} primary={t.primary}
                icon={t.icon} label={t.label} onClick={() => onPick(t.key)} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** Un solo pulsante di aggiornamento per motore e negozio. */
function ReloadButton({ engineLoading, onEngineReload }: { engineLoading: boolean; onEngineReload: () => void }) {
  const { palette } = useTheme();
  const { loading: storeLoading, reload: storeReload } = useStore();
  const busy = engineLoading || storeLoading;
  return (
    <button
      onClick={() => { onEngineReload(); storeReload(); }}
      disabled={busy}
      title="Aggiorna"
      style={{ ...iconBtn(palette), cursor: busy ? "wait" : "pointer", opacity: busy ? 0.5 : 1 }}
    >
      <IconRefresh />
    </button>
  );
}

/** Stato della lettura di WooCommerce: risponde lento, meglio dirlo. */
function StoreStatus({ active }: { active: boolean }) {
  const { palette } = useTheme();
  const { loading, error, store } = useStore();
  if (!active) return <span />;
  if (error) {
    return (
      <span style={{ fontSize: 11, color: palette.negative }}>
        WooCommerce non raggiungibile: {error}
      </span>
    );
  }
  if (loading) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: palette.textDim }}>
        <span style={{
          width: 11, height: 11, borderRadius: "50%",
          border: `2px solid ${palette.cardBorder}`, borderTopColor: ACCENT,
          animation: "pf-spin 0.8s linear infinite", display: "inline-block",
        }} />
        Lettura ordini da WooCommerce…
      </span>
    );
  }
  if (!store) return <span />;
  if (store.fonti_mancanti?.length) {
    return (
      <span style={{ fontSize: 11, color: WOOD }}>
        Da WooCommerce non sono arrivate tutte le voci di questa lettura:{" "}
        {store.fonti_mancanti.join(", ")}. Il resto è aggiornato.
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, color: palette.textDim }}>
      Ordini e prodotti letti da WooCommerce
    </span>
  );
}

function SidebarLink({ active, primary, icon, label, onClick }: {
  active: boolean; primary?: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  const { palette } = useTheme();
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "0.62rem 0.85rem", borderRadius: 9, border: "none",
      background: active ? palette.buttonHover : "transparent",
      color: active ? palette.text : palette.textMuted,
      fontSize: 13, fontWeight: primary ? 700 : (active ? 600 : 500),
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
function IconBox() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>; }
function IconGrid() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>; }
function IconFunnel() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>; }
function IconTruck() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>; }
function IconUsers() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>; }
function IconAds() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 11-5.8-1.6" /></svg>; }
function IconSpark() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" /></svg>; }
function IconSearch() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconRoadmap() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>; }
function IconMeetings() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>; }
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
