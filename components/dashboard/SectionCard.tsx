export function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, overflow: "hidden" }}>
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid #e4e4e7",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#18181b", letterSpacing: "-0.01em" }}>
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: "1rem 1.25rem" }}>{children}</div>
    </div>
  );
}
