import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard MOMI",
  robots: {
    index: false, follow: false, nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function MomiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
