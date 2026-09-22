"use client";

/**
 * Logo ufficiale di Onlywood, lo stesso che il sito mostra in testata
 * (logo20anni-web.png). È un emblema a colori pieni, quindi vale identico
 * su tema chiaro e scuro: non servono due varianti.
 */
export function Logo({ height = 34, center }: { height?: number; center?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logos/onlywood.png"
      alt="Onlywood"
      style={{
        height, width: "auto", display: "block", maxWidth: "100%",
        margin: center ? "0 auto" : undefined,
      }}
    />
  );
}
