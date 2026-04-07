import { Skeleton } from "./Skeleton";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "red" | "yellow" | "violet" | "default";
  loading?: boolean;
}

const ACCENT_COLORS = {
  green:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#22c55e" },
  red:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",  text: "#ef4444" },
  yellow: { bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)",  text: "#eab308" },
  violet: { bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
  default:{ bg: "#ffffff",                 border: "#e4e4e7",              text: "#18181b" },
};

export function KpiCard({ label, value, sub, accent = "default", loading = false }: KpiCardProps) {
  const c = ACCENT_COLORS[accent];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: "1.25rem 1.5rem",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <span style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
        {label}
      </span>
      {loading ? (
        <Skeleton h={28} w="60%" />
      ) : (
        <span style={{ fontSize: 26, fontWeight: 700, color: c.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </span>
      )}
      {sub && !loading && (
        <span style={{ fontSize: 11, color: "#71717a" }}>{sub}</span>
      )}
    </div>
  );
}
