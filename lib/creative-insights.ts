// Letture automatiche delle creatività del periodo selezionato.
//
// Tutto qui dentro è aritmetica sui dati che la dashboard già mostra: nessuna
// stima, nessun testo inventato. Le frasi descrivono cosa dicono i numeri e non
// dicono mai cosa fare: la dashboard è aperta dal cliente.

export type InsightTone = "positive" | "neutral" | "attention";

export type InsightItem = { label: string; detail: string };

export type Insight = {
  id: string;
  title: string;
  body: string;
  tone: InsightTone;
  items?: InsightItem[];
};

/** Una creatività, ridotta ai campi che servono alla lettura. */
export type InsightCreative = {
  nome: string;
  formato: string;
  /** Taglio creativo: soggetto per Gondolina, angolo per MOMI. */
  soggetto?: string | null;
  isVideo: boolean;
  spesa: number;
  impression: number;
  /** Risultato principale del periodo (registrazioni, carrelli…). */
  risultati: number;
  /** Costo per risultato: null quando il risultato non è ancora arrivato. */
  costo: number | null;
  /** Percentuali, quando disponibili. */
  hook: number | null;
  hold: number | null;
  ctr: number | null;
  giorni?: number | null;
  /** Stesso costo sulla finestra più lunga: serve a leggere la tendenza. */
  costoPrecedente?: number | null;
};

export type InsightConfig = {
  /** "registrazioni", "carrelli"… al plurale, minuscolo. */
  risultatoLabel: string;
  /** "costo per registrazione", "costo per carrello". */
  costoLabel: string;
  /** Spesa sotto la quale una creatività non è ancora leggibile. */
  minSpesa: number;
  /** Soglia di riferimento sul costo, se il cliente ne ha una. */
  costoBuono?: number | null;
  /** Finestre confrontate nella tendenza, per scriverlo in chiaro. */
  finestraBreve?: string;
  finestraLunga?: string;
  eur: (n: number) => string;
  pct: (n: number, digits?: number) => string;
  integer: (n: number) => string;
};

// ─── Utilità ──────────────────────────────────────────────────────

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Costo del gruppo: spesa totale diviso risultati totali, non media dei costi. */
function costoAggregato(rows: InsightCreative[]): number | null {
  const risultati = sum(rows.map((r) => r.risultati));
  return risultati > 0 ? sum(rows.map((r) => r.spesa)) / risultati : null;
}

function pctDiff(value: number, reference: number): number {
  return reference > 0 ? ((value - reference) / reference) * 100 : 0;
}

/** "il 28% sotto" / "il 12% sopra" */
function scarto(value: number, reference: number, pct: InsightConfig["pct"]): string {
  const d = pctDiff(value, reference);
  return `${pct(Math.abs(d), 0)} ${d < 0 ? "sotto" : "sopra"}`;
}

function weighted(rows: InsightCreative[], pick: (r: InsightCreative) => number | null): number | null {
  const usable = rows.filter((r) => pick(r) != null && r.impression > 0);
  const impressioni = sum(usable.map((r) => r.impression));
  if (impressioni <= 0) return null;
  return sum(usable.map((r) => (pick(r) as number) * r.impression)) / impressioni;
}

/** Il taglio (formato o soggetto) più ricorrente in un gruppo. */
function ricorrenza(rows: InsightCreative[], pick: (r: InsightCreative) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = (pick(r) ?? "").trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) if (!best || count > best.count) best = { key, count };
  return best;
}

// ─── Letture ──────────────────────────────────────────────────────

export function buildCreativeInsights(creatives: InsightCreative[], cfg: InsightConfig): Insight[] {
  const insights: Insight[] = [];
  const leggibili = creatives.filter((c) => c.spesa >= cfg.minSpesa);
  const conCosto = leggibili.filter((c) => c.costo != null && c.costo > 0);
  const costoMedio = costoAggregato(leggibili);

  // Con pochi dati qualsiasi confronto sarebbe rumore
  if (leggibili.length < 3 || costoMedio == null) {
    return [{
      id: "dati-limitati",
      tone: "neutral",
      title: "Lettura ancora parziale",
      body: `Nel periodo selezionato ${leggibili.length === 0 ? "nessuna creatività ha" : `solo ${cfg.integer(leggibili.length)} creatività hanno`} superato ${cfg.eur(cfg.minSpesa)} di spesa: troppo poco perché i confronti fra creatività siano significativi.`,
    }];
  }

  const costiOrdinati = [...conCosto].sort((a, b) => (a.costo as number) - (b.costo as number));
  const mediana = median(conCosto.map((c) => c.costo as number));

  // 1. Le creatività che portano risultati al costo più basso
  if (costiOrdinati.length >= 2 && mediana != null) {
    const migliori = costiOrdinati.filter((c) => (c.costo as number) < costoMedio).slice(0, 3);
    if (migliori.length > 0) {
      insights.push({
        id: "da-replicare",
        tone: "positive",
        title: "Le creatività che reggono il periodo",
        body: `${migliori.length === 1 ? "Una creatività porta" : `${cfg.integer(migliori.length)} creatività portano`} ${cfg.risultatoLabel} sotto la media del periodo (${cfg.eur(costoMedio)}). Insieme valgono ${cfg.integer(sum(migliori.map((c) => c.risultati)))} ${cfg.risultatoLabel} su ${cfg.integer(sum(leggibili.map((c) => c.risultati)))}.`,
        items: migliori.map((c) => ({
          label: c.nome,
          detail: `${cfg.eur(c.costo as number)} · ${scarto(c.costo as number, costoMedio, cfg.pct)} la media · ${cfg.integer(c.risultati)} ${cfg.risultatoLabel} · ${cfg.eur(c.spesa)} di spesa`,
        })),
      });
    }

    // 2. Cosa hanno in comune le migliori: formato e taglio creativo
    const top = costiOrdinati.slice(0, Math.max(3, Math.ceil(costiOrdinati.length / 3)));
    const formato = ricorrenza(top, (c) => c.formato);
    const soggetto = ricorrenza(top, (c) => c.soggetto);
    const tratti: string[] = [];
    const formatoRicorrente = formato && formato.count >= 2 && formato.count / top.length >= 0.5 ? formato : null;
    if (formatoRicorrente) {
      tratti.push(`${cfg.integer(formatoRicorrente.count)} su ${cfg.integer(top.length)} sono ${formatoRicorrente.key.toLowerCase()}`);
    }
    if (soggetto && soggetto.count >= 2 && soggetto.count / top.length >= 0.5) {
      tratti.push(`${cfg.integer(soggetto.count)} su ${cfg.integer(top.length)} hanno lo stesso taglio creativo, «${soggetto.key}»`);
    }
    // Il "sono tutte video" si dice solo se il formato non lo ha già detto
    const videoTop = top.filter((c) => c.isVideo).length;
    const formatoGiaVideo = /video|reel/i.test(formatoRicorrente?.key ?? "");
    if (videoTop === top.length && top.length >= 3 && !formatoGiaVideo) {
      tratti.push("sono tutte video");
    }
    if (tratti.length > 0) {
      insights.push({
        id: "tratti-comuni",
        tone: "neutral",
        title: "Cosa accomuna le creatività con il costo più basso",
        body: `Guardando le ${cfg.integer(top.length)} con ${cfg.costoLabel} più basso: ${tratti.join(", ")}.`,
      });
    }
  }

  // 3. Video che agganciano ma non portano risultati: è lì che si vede lo script
  const video = leggibili.filter((c) => c.isVideo && c.hook != null && c.impression > 0);
  if (video.length >= 3) {
    const hookMediano = median(video.map((c) => c.hook as number));
    const hookMedio = weighted(video, (c) => c.hook);
    if (hookMediano != null && hookMedio != null) {
      const agganciaNonConverte = video
        .filter((c) => (c.hook as number) > hookMediano && c.costo != null && (c.costo as number) > costoMedio)
        .sort((a, b) => (b.hook as number) - (a.hook as number))
        .slice(0, 2);
      if (agganciaNonConverte.length > 0) {
        insights.push({
          id: "hook-senza-conversione",
          tone: "attention",
          title: "Attenzione alta, risultato che non segue",
          body: `Alcuni video trattengono più della media nei primi secondi (hook mediano ${cfg.pct(hookMediano, 1)}) ma il ${cfg.costoLabel} resta sopra la media del periodo. L'aggancio funziona, la parte che porta ${cfg.risultatoLabel} no.`,
          items: agganciaNonConverte.map((c) => ({
            label: c.nome,
            detail: `hook ${cfg.pct(c.hook as number, 1)} · ${cfg.costoLabel} ${cfg.eur(c.costo as number)} · ${scarto(c.costo as number, costoMedio, cfg.pct)} la media`,
          })),
        });
      }

      // 4. Ritenzione: chi resta dopo l'aggancio
      const conHold = video.filter((c) => c.hold != null);
      const holdMediano = median(conHold.map((c) => c.hold as number));
      if (conHold.length >= 3 && holdMediano != null) {
        const tengono = conHold
          .filter((c) => (c.hold as number) > holdMediano)
          .sort((a, b) => (b.hold as number) - (a.hold as number))
          .slice(0, 2);
        if (tengono.length > 0) {
          insights.push({
            id: "ritenzione",
            tone: "neutral",
            title: "I video che trattengono più a lungo",
            body: `La ritenzione mediana dei video del periodo è ${cfg.pct(holdMediano, 1)}. Questi restano sopra: chi si aggancia arriva più avanti nel racconto.`,
            items: tengono.map((c) => ({
              label: c.nome,
              detail: `ritenzione ${cfg.pct(c.hold as number, 1)}${c.hook != null ? ` · hook ${cfg.pct(c.hook, 1)}` : ""}${c.costo != null ? ` · ${cfg.costoLabel} ${cfg.eur(c.costo)}` : ""}`,
            })),
          });
        }
      }
    }
  }

  // 5. Tendenza del costo fra le due finestre
  const conTendenza = leggibili.filter((c) => c.costo != null && c.costoPrecedente != null && (c.costoPrecedente as number) > 0);
  if (conTendenza.length >= 3 && cfg.finestraBreve && cfg.finestraLunga) {
    const inPeggioramento = conTendenza
      .filter((c) => pctDiff(c.costo as number, c.costoPrecedente as number) >= 20)
      .sort((a, b) => pctDiff(b.costo as number, b.costoPrecedente as number) - pctDiff(a.costo as number, a.costoPrecedente as number))
      .slice(0, 3);
    const inMiglioramento = conTendenza
      .filter((c) => pctDiff(c.costo as number, c.costoPrecedente as number) <= -20)
      .sort((a, b) => pctDiff(a.costo as number, a.costoPrecedente as number) - pctDiff(b.costo as number, b.costoPrecedente as number))
      .slice(0, 3);

    if (inPeggioramento.length > 0) {
      insights.push({
        id: "tendenza-costo",
        tone: "attention",
        title: `Costo in salita ${cfg.finestraBreve}`,
        body: inPeggioramento.length === 1
          ? `Su una creatività il ${cfg.costoLabel} ${cfg.finestraBreve} è più alto di almeno il 20% rispetto ${cfg.finestraLunga}.`
          : `Su ${cfg.integer(inPeggioramento.length)} creatività il ${cfg.costoLabel} ${cfg.finestraBreve} è più alto di almeno il 20% rispetto ${cfg.finestraLunga}.`,
        items: inPeggioramento.map((c) => ({
          label: c.nome,
          detail: `${cfg.eur(c.costo as number)} contro ${cfg.eur(c.costoPrecedente as number)} · ${scarto(c.costo as number, c.costoPrecedente as number, cfg.pct)}`,
        })),
      });
    }
    if (inMiglioramento.length > 0) {
      insights.push({
        id: "tendenza-costo-giu",
        tone: "positive",
        title: `Costo in discesa ${cfg.finestraBreve}`,
        body: `Qui il ${cfg.costoLabel} ${cfg.finestraBreve} è sceso di almeno il 20% rispetto ${cfg.finestraLunga}.`,
        items: inMiglioramento.map((c) => ({
          label: c.nome,
          detail: `${cfg.eur(c.costo as number)} contro ${cfg.eur(c.costoPrecedente as number)} · ${scarto(c.costo as number, c.costoPrecedente as number, cfg.pct)}`,
        })),
      });
    }
  }

  // 6. Quanto pesa la creatività che spende di più
  const spesaTotale = sum(leggibili.map((c) => c.spesa));
  const perSpesa = [...leggibili].sort((a, b) => b.spesa - a.spesa);
  if (spesaTotale > 0 && perSpesa.length >= 3) {
    const prime = perSpesa.slice(0, 3);
    const quota = (sum(prime.map((c) => c.spesa)) / spesaTotale) * 100;
    if (quota >= 60) {
      insights.push({
        id: "concentrazione",
        tone: "neutral",
        title: "La spesa è concentrata su poche creatività",
        body: `Le prime tre assorbono il ${cfg.pct(quota, 0)} della spesa del periodo (${cfg.eur(sum(prime.map((c) => c.spesa)))} su ${cfg.eur(spesaTotale)}). Il confronto fra creatività si regge quasi tutto su queste.`,
        items: prime.map((c) => ({
          label: c.nome,
          detail: `${cfg.eur(c.spesa)} · ${cfg.pct((c.spesa / spesaTotale) * 100, 0)} della spesa${c.costo != null ? ` · ${cfg.costoLabel} ${cfg.eur(c.costo)}` : ""}`,
        })),
      });
    }
  }

  // 7. Creatività ancora senza risultati nonostante la spesa
  const senzaRisultati = leggibili
    .filter((c) => c.risultati === 0)
    .sort((a, b) => b.spesa - a.spesa)
    .slice(0, 3);
  if (senzaRisultati.length > 0) {
    insights.push({
      id: "senza-risultati",
      tone: "attention",
      title: `Spesa senza ${cfg.risultatoLabel} nel periodo`,
      body: `${senzaRisultati.length === 1 ? "Una creatività ha" : `${cfg.integer(senzaRisultati.length)} creatività hanno`} superato ${cfg.eur(cfg.minSpesa)} di spesa senza portare ${cfg.risultatoLabel} nel periodo selezionato.`,
      items: senzaRisultati.map((c) => ({
        label: c.nome,
        detail: `${cfg.eur(c.spesa)} di spesa · ${cfg.integer(c.impression)} impression${c.ctr != null ? ` · CTR ${cfg.pct(c.ctr, 2)}` : ""}`,
      })),
    });
  }

  // 8. Quante creatività stanno ancora raccogliendo dati
  const inRaccolta = creatives.length - leggibili.length;
  if (inRaccolta > 0) {
    insights.push({
      id: "in-raccolta",
      tone: "neutral",
      title: "Creatività ancora in raccolta",
      body: `${inRaccolta === 1 ? "Una creatività è" : `${cfg.integer(inRaccolta)} creatività sono`} sotto ${cfg.eur(cfg.minSpesa)} di spesa nel periodo: i loro numeri non sono ancora confrontabili con il resto.`,
    });
  }

  return insights;
}
