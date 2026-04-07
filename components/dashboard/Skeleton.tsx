export function Skeleton({ w = "100%", h = 16, radius = 6 }: { w?: string | number; h?: number; radius?: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: radius,
        background: "linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

export function SkeletonBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} h={14} w={i % 3 === 2 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
