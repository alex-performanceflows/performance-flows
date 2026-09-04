"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  DashboardData, fmtDateTime, Skeleton,
  ThemeProvider, useTheme,
} from "./shared";
import { PanoramicaTab } from "./PanoramicaTab";
import { TrafficoTab } from "./TrafficoTab";
import { SEOTab } from "./SEOTab";
import { EcommerceTab } from "./EcommerceTab";
import { AdvertisingTab } from "./AdvertisingTab";

type Tab = "panoramica" | "traffico" | "seo" | "ecommerce" | "advertising";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "panoramica", label: "Panoramica", icon: <IconOverview /> },
  { key: "traffico", label: "Traffico", icon: <IconTraffic /> },
  { key: "seo", label: "SEO", icon: <IconSearch /> },
  { key: "ecommerce", label: "Ecommerce", icon: <IconCart /> },
  { key: "advertising", label: "Advertising", icon: <IconAds /> },
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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("panoramica");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vitaedna", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json as DashboardData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";
  const isDark = theme === "dark";
  const logoFilter = isDark ? "brightness(0) invert(1)" : "none";

  return (
    <div data-theme={theme} style={{
      minHeight: "100dvh",
      background: palette.shellBg,
      color: palette.text,
      fontFamily: "Inter, sans-serif",
    }}>
      <div className="pf-shell">
        {/* Sidebar */}
        <aside className="pf-sidebar" style={{
          background: palette.sidebarBg,
          borderRight: `1px solid ${palette.sidebarBorder}`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}>
          {/* Logo */}
          <div style={{ padding: "1.5rem 1.25rem 1.75rem" }}>
            <Image
              src="/images/logo-vitaedna.svg"
              alt="VitaeDNA"
              width={238}
              height={57}
              priority
              style={{
                height: 38, width: "auto", display: "block",
                filter: logoFilter,
              }}
            />
            <p style={{
              margin: "0.6rem 0 0",
              fontSize: 10, fontWeight: 700,
              color: palette.textFaint,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Dashboard marketing
            </p>
          </div>

          {/* Tab list */}
          <nav style={{
            padding: "0 0.75rem",
            display: "flex", flexDirection: "column", gap: 2,
            flex: 1,
          }}>
            {TABS.map((t) => (
              <SidebarLink
                key={t.key}
                active={tab === t.key}
                icon={t.icon}
                label={t.label}
                onClick={() => { setTab(t.key); setMobileNavOpen(false); }}
              />
            ))}
          </nav>

          {/* Footer */}
          <div style={{
            padding: "1rem 1.25rem 1.25rem",
            borderTop: `1px solid ${palette.divider}`,
            fontSize: 11,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 8, marginBottom: 6,
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: palette.textDim,
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Aggiornato
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={toggle}
                  aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
                  title={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: `1px solid ${palette.inputBorder}`,
                    background: palette.input,
                    color: palette.textMuted,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {isDark ? <IconSun /> : <IconMoon />}
                </button>
                <button
                  onClick={load}
                  disabled={loading}
                  aria-label="Aggiorna dati"
                  title="Aggiorna dati"
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    border: `1px solid ${palette.inputBorder}`,
                    background: palette.input,
                    color: palette.textMuted,
                    cursor: loading ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: loading ? 0.5 : 1,
                    padding: 0,
                  }}
                >
                  <IconRefresh />
                </button>
              </div>
            </div>
            <div style={{ color: palette.textMuted, fontSize: 11, lineHeight: 1.4 }}>
              {loading && !data ? (
                <Skeleton width={120} height={11} />
              ) : data?.updated_at ? (
                fmtDateTime(data.updated_at)
              ) : "—"}
            </div>
            <p style={{ margin: "0.9rem 0 0", fontSize: 10, color: palette.textFaint }}>
              Performance Flows
            </p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="pf-mobile-bar" style={{
          background: palette.sidebarBg,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${palette.divider}`,
          padding: "0.8rem 1rem",
          display: "none",
          alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src="/images/logo-vitaedna.svg"
              alt="VitaeDNA"
              width={238}
              height={57}
              style={{ height: 28, width: "auto", filter: logoFilter }}
            />
            <span style={{
              fontSize: 12, color: palette.textDim,
              paddingLeft: 10, borderLeft: `1px solid ${palette.divider}`,
            }}>
              {activeLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={toggle}
              aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${palette.inputBorder}`,
                background: palette.input,
                color: palette.text, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              {isDark ? <IconSun /> : <IconMoon />}
            </button>
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Menu"
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${palette.inputBorder}`,
                background: palette.input,
                color: palette.text, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileNavOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileNavOpen && (
          <div
            className="pf-mobile-menu"
            style={{
              display: "none",
              background: palette.sidebarBg,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${palette.divider}`,
              padding: "0.75rem",
              position: "sticky", top: 62, zIndex: 39,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {TABS.map((t) => (
                <SidebarLink
                  key={t.key}
                  active={tab === t.key}
                  icon={t.icon}
                  label={t.label}
                  onClick={() => { setTab(t.key); setMobileNavOpen(false); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="pf-main">
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: isDark ? "#fecaca" : "#991b1b",
              padding: "1rem 1.25rem", borderRadius: 12,
              marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              <div>
                <strong style={{ color: isDark ? "#f87171" : "#b91c1c" }}>Errore nel caricamento dei dati:</strong>{" "}
                <span style={{ fontSize: 13 }}>{error}</span>
              </div>
              <button
                onClick={load}
                style={{
                  padding: "0.5rem 1rem", borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.4)",
                  background: "rgba(239,68,68,0.15)",
                  color: isDark ? "#ffffff" : "#7f1d1d",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Riprova
              </button>
            </div>
          )}

          {loading && !data && <SkeletonPage />}

          {data && (
            <>
              {tab === "panoramica" && <PanoramicaTab data={data} />}
              {tab === "traffico" && <TrafficoTab data={data} />}
              {tab === "seo" && <SEOTab data={data} />}
              {tab === "ecommerce" && <EcommerceTab data={data} />}
              {tab === "advertising" && <AdvertisingTab data={data} />}
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
          background: ${isDark ? "#06080f" : "#f0f6fc"};
          transition: background 0.25s;
        }

        .pf-shell {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 100dvh;
          max-width: 1600px;
          margin: 0 auto;
        }
        .pf-sidebar {
          position: sticky;
          top: 0;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .pf-main {
          padding: 1.75rem 2rem 3rem;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .pf-shell {
            display: block;
          }
          .pf-sidebar {
            display: none;
          }
          .pf-mobile-bar {
            display: flex !important;
          }
          .pf-mobile-menu {
            display: block !important;
          }
          .pf-main {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Sidebar link ─────────────────────────────────────────────────

function SidebarLink({
  active, icon, label, onClick,
}: {
  active: boolean; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  const { palette } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0.7rem 0.85rem",
        borderRadius: 9,
        border: "none",
        background: active ? palette.buttonHover : "transparent",
        color: active ? palette.text : palette.textMuted,
        fontSize: 13, fontWeight: active ? 600 : 500,
        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        letterSpacing: "-0.01em",
        transition: "all 0.15s",
        position: "relative",
      }}
    >
      {active && (
        <span style={{
          position: "absolute", left: -12, top: "50%",
          transform: "translateY(-50%)",
          width: 3, height: 20, borderRadius: 2,
          background: "linear-gradient(180deg, #64CBFF 0%, #96C228 100%)",
        }} />
      )}
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        color: active ? "#64CBFF" : palette.textDim,
      }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────

function IconOverview() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>; }
function IconTraffic() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>; }
function IconSearch() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>; }
function IconCart() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>; }
function IconAds() { return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 11-5.8-1.6" /></svg>; }
function IconRefresh() { return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>; }
function IconSun() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>; }
function IconMoon() { return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>; }

function SkeletonPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Skeleton width={200} height={22} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ borderRadius: 14, padding: 18 }}>
            <Skeleton width="60%" height={10} />
            <div style={{ height: 12 }} />
            <Skeleton width="80%" height={22} />
            <div style={{ height: 10 }} />
            <Skeleton width="40%" height={10} />
          </div>
        ))}
      </div>
      <Skeleton height={320} style={{ borderRadius: 14 }} />
      <Skeleton height={220} style={{ borderRadius: 14 }} />
    </div>
  );
}
