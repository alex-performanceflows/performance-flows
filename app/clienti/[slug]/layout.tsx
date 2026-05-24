import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portale Cliente | Performance Flows",
  robots: { index: false, follow: false },
};

export default function ClientiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
