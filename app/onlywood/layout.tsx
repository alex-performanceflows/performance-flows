import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulatore Fee — Performance Flows × OnlyWood",
  description: "Simulatore di collaborazione riservato.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OnlywoodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
