import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Onlywood",
  // Segnaposto della scheda: la "OW" verde che il sito usa come favicon
  icons: { icon: "/logos/onlywood-icon.png" },
  robots: {
    index: false, follow: false, nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function OnlywoodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
