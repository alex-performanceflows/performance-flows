"use client";

import type { StoreData } from "@/lib/onlywood-store";
import { Card, Skeleton, useStore, useTheme } from "./shared";

/**
 * Involucro per i blocchi che vivono di dati WooCommerce: il negozio risponde
 * in decine di secondi la prima volta, quindi qui si aspetta esplicitamente
 * invece di mostrare zeri che sembrerebbero un calo.
 */
export function StoreSection({
  children, height = 220,
}: { children: (store: StoreData) => React.ReactNode; height?: number }) {
  const { palette } = useTheme();
  const { store, loading, error } = useStore();

  if (error) {
    return (
      <Card>
        <p style={{ margin: 0, fontSize: 13, color: palette.textMuted }}>
          I dati del negozio non sono arrivati: {error}
        </p>
      </Card>
    );
  }
  if (!store) {
    return (
      <Card padding={0} style={{ overflow: "hidden" }}>
        <Skeleton height={height} style={{ borderRadius: 14 }} />
        {loading && (
          <p style={{
            position: "relative", margin: 0, padding: "0.6rem 1rem",
            fontSize: 11, color: palette.textDim, textAlign: "center", marginTop: -34,
          }}>
            Lettura di ordini e prodotti da WooCommerce…
          </p>
        )}
      </Card>
    );
  }
  return <>{children(store)}</>;
}
