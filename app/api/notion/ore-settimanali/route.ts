import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, getNumber, getPeople, getDate, DB } from "@/lib/notion";

/** Returns "YYYY-WNN" ISO week string for a date string */
function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7; // Mon=1 … Sun=7
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Returns "lun DD MMM" label for Monday of an ISO week */
function weekLabel(isoW: string): string {
  const [yearStr, wStr] = isoW.split("-W");
  const year = Number(yearStr);
  const week = Number(wStr);
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7);
  return monday.toLocaleDateString("it-IT", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export async function GET(req: NextRequest) {
  if (!process.env.NOTION_TOKEN) {
    return NextResponse.json({ error: "NOTION_TOKEN not configured" }, { status: 500 });
  }

  // Accept ?weeks=N (default 8) or explicit ?from=YYYY-MM-DD&to=YYYY-MM-DD
  const params = req.nextUrl.searchParams;
  let from: string;
  let to: string;

  if (params.get("from") && params.get("to")) {
    from = params.get("from")!;
    to = params.get("to")!;
  } else {
    const weeks = Math.min(52, Math.max(1, Number(params.get("weeks") || 8)));
    const toDate = new Date();
    const fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate() - weeks * 7);
    from = fromDate.toISOString().slice(0, 10);
    to = toDate.toISOString().slice(0, 10);
  }

  try {
    const [tasks, touchpoints] = await Promise.all([
      queryDatabase(DB.task, {
        filter: {
          and: [
            { property: "Stato", status: { equals: "Fatto" } },
            { property: "Scadenza", date: { on_or_after: from } },
            { property: "Scadenza", date: { before: to } },
          ],
        },
      }),
      queryDatabase(DB.touchpoints, {
        filter: {
          and: [
            { property: "Data", date: { on_or_after: from } },
            { property: "Data", date: { before: to } },
          ],
        },
      }),
    ]);

    // Map: week → person → hours
    const matrix: Record<string, Record<string, number>> = {};
    const peopleSet = new Set<string>();

    function addToMatrix(date: string | null, ore: number, people: string[]) {
      if (!date || !ore || people.length === 0) return;
      const week = isoWeek(date);
      if (!matrix[week]) matrix[week] = {};
      for (const person of people) {
        peopleSet.add(person);
        matrix[week][person] = (matrix[week][person] ?? 0) + ore;
      }
    }

    for (const task of tasks) {
      const p = task.properties;
      addToMatrix(getDate(p, "Scadenza"), getNumber(p, "Tempo impiegato (h)"), getPeople(p, "Assigned To"));
    }

    for (const tp of touchpoints) {
      const p = tp.properties;
      addToMatrix(getDate(p, "Data"), getNumber(p, "Durata (h)"), getPeople(p, "Partecipanti"));
    }

    const weeks = Object.keys(matrix).sort();
    const people = Array.from(peopleSet).sort();

    // Build rows with totals
    const rows = weeks.map((w) => {
      const cells: Record<string, number> = {};
      let total = 0;
      for (const person of people) {
        const h = matrix[w][person] ?? 0;
        cells[person] = h;
        total += h;
      }
      return { week: w, label: weekLabel(w), cells, total };
    });

    // Column totals
    const colTotals: Record<string, number> = {};
    for (const person of people) {
      colTotals[person] = rows.reduce((s, r) => s + (r.cells[person] ?? 0), 0);
    }
    const grandTotal = rows.reduce((s, r) => s + r.total, 0);

    // Column averages (only over weeks where person has > 0 hours)
    const colAvg: Record<string, number> = {};
    for (const person of people) {
      const activeWeeks = rows.filter((r) => (r.cells[person] ?? 0) > 0).length;
      colAvg[person] = activeWeeks > 0 ? colTotals[person] / activeWeeks : 0;
    }

    return NextResponse.json({
      from,
      to,
      weeks: weeks.length,
      people,
      rows,
      colTotals,
      colAvg,
      grandTotal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[ore-settimanali]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
