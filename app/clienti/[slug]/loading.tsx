function SkeletonBar({ w = "100%", h = 14 }: { w?: string; h?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 6,
      background: "linear-gradient(90deg, #eeecea 25%, #e2e0dd 50%, #eeecea 75%)",
      backgroundSize: "400% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e6e3", padding: "1.5rem" }}>
      <SkeletonBar w="30%" h={18} />
      <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBar key={i} w={i % 3 === 2 ? "65%" : "100%"} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div style={{ minHeight: "100dvh", background: "#f7f6f4", fontFamily: "Inter, sans-serif" }}>
      {/* Header skeleton */}
      <div style={{ background: "#1a2580", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
          <SkeletonBar w="140px" h={16} />
        </div>
        <div style={{ width: 120, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.15)" }} />
      </div>

      {/* Content skeleton */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionSkeleton rows={5} />
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
      </div>
    </div>
  );
}
