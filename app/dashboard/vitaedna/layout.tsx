import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard VitaeDNA",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function VitaEDnaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
