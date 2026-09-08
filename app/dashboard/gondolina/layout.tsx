import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Gondolina",
  robots: {
    index: false, follow: false, nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function GondolinaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
