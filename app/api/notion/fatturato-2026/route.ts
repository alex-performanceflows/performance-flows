import { NextResponse } from "next/server";
import { queryDatabase, getNumber, getFormulaNumber, getSelect, getDate, getText, DB } from "@/lib/notion";

const YEAR = 2026;
const Y_START = `${YEAR}-01-01`;
const Y_END   = `${YEAR}-12-31`;

/** Number of months a contract overlaps with YEAR (1-based months, inclusive) */
function mesiIn2026(dataInizio: string | null, dataFine: string | null): number {
  // Clamp to year boundaries
  const start = dataInizio && dataInizio > Y_START ? dataInizio : Y_START;
  const end   = dataFine   && dataFine   < Y_END   ? dataFine   : Y_END;

  if (start > end) return 0;

  const [sy, sm] = start.slice(0, 7).split("-").map(Number);
  const [ey, em] = end.slice(0, 7).split("-").map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

export async function GET() {
  if (!process.env.NOTION_TOKEN) {
    return NextResponse.json({ error: "NOTION_TOKEN not configured" }, { status: 500 });
  }

  try {
    // Fetch ALL contracts that overlap with 2026:
    // Data Inizio <= 2026-12-31  AND  (Data Fine >= 2026-01-01  OR  Data Fine is empty)
    const allContratti = await queryDatabase(DB.contratti, {
      filter: {
        and: [
          // started before or during 2026
          { property: "Data Inizio", date: { on_or_before: Y_END } },
          // not ended before 2026 (or no end date)
          {
            or: [
              { property: "Data Fine", date: { on_or_after: Y_START } },
              { property: "Data Fine", date: { is_empty: true } },
            ],
          },
        ],
      },
    });

    let mrrFatturato2026 = 0;
    let valoreUnaT2026   = 0;

    const righeRicorrenti: { nome: string; dataInizio: string | null; dataFine: string | null; mesi: number; mrrNetto: number; contributo: number }[] = [];
    const righeUnaT:        { nome: string; dataInizio: string | null; valore: number }[] = [];

    for (const page of allContratti) {
      const p = page.properties;
      const tipo       = getSelect(p, "Tipo");
      const dataInizio = getDate(p, "Data Inizio");
      const dataFine   = getDate(p, "Data Fine");
      const nome       = getText(p, "Descrizione");

      if (tipo === "Ricorrente") {
        const mrrNetto  = getFormulaNumber(p, "Valore MRR Netto");
        const mesi      = mesiIn2026(dataInizio, dataFine);
        const contributo = mesi * mrrNetto;
        mrrFatturato2026 += contributo;
        righeRicorrenti.push({ nome, dataInizio, dataFine, mesi, mrrNetto, contributo });
      } else {
        // Una tantum: conta se Data Inizio è nel 2026 (o, se manca, se Data Fine è nel 2026)
        const refDate = dataInizio ?? dataFine;
        if (refDate && refDate >= Y_START && refDate <= Y_END) {
          const valore = getNumber(p, "Valore");
          valoreUnaT2026 += valore;
          righeUnaT.push({ nome, dataInizio, valore });
        }
      }
    }

    const totale2026 = mrrFatturato2026 + valoreUnaT2026;

    return NextResponse.json({
      year: YEAR,
      mrrFatturato2026,
      valoreUnaT2026,
      totale2026,
      righeRicorrenti,
      righeUnaT,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[fatturato-2026]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
