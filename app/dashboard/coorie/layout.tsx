import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Coorie Beauty",
  robots: {
    index: false, follow: false, nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function CoorieLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
