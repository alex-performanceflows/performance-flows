import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Centogiri",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function CentogiriLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
