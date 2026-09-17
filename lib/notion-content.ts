// Contenuto delle pagine Notion in forma serializzabile, per mostrarlo fuori da Notion
// (dashboard cliente). Solo i tipi di blocco testuali più comuni: il resto viene ignorato.

const NOTION_VERSION = "2022-06-28";

export type RichSpan = {
  text: string;
  href?: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  code?: boolean;
};

export type ContentBlockType =
  | "paragraph" | "heading_1" | "heading_2" | "heading_3"
  | "bulleted_list_item" | "numbered_list_item" | "to_do"
  | "toggle" | "quote" | "callout" | "divider" | "image" | "code" | "table";

export type ContentBlock = {
  type: ContentBlockType;
  spans?: RichSpan[];
  checked?: boolean;
  /** Solo immagini. Gli URL dei file caricati su Notion scadono dopo circa un'ora. */
  url?: string;
  /** Solo codice. */
  language?: string;
  /** Solo tabelle: righe di celle, ogni cella è una sequenza di span. */
  rows?: RichSpan[][][];
  /** Solo tabelle: la prima riga è l'intestazione. */
  header?: boolean;
  children?: ContentBlock[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawBlock = any;

const TEXT_TYPES = new Set<ContentBlockType>([
  "paragraph", "heading_1", "heading_2", "heading_3",
  "bulleted_list_item", "numbered_list_item", "to_do", "toggle", "quote", "callout",
]);

const MAX_DEPTH = 6;

// ─── Richieste con limite di concorrenza e retry sul rate limit ────

const MAX_CONCURRENT = 3;
let active = 0;
const queue: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  // Chi è in coda riceve lo slot direttamente da chi termina
  if (active >= MAX_CONCURRENT) await new Promise<void>((resolve) => queue.push(resolve));
  else active++;
  try {
    return await fn();
  } finally {
    const next = queue.shift();
    if (next) next(); else active--;
  }
}

export async function notionGet<T = RawBlock>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await withSlot(() => fetch(`https://api.notion.com/v1${path}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
      },
      cache: "no-store",
    }));
    if (res.ok) return res.json() as Promise<T>;
    // Rate limit o errore temporaneo: si riprova rispettando Retry-After
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = Number(res.headers.get("retry-after")) || 0.6 * 2 ** attempt;
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    throw Object.assign(new Error(`Notion ${res.status} su ${path.split("?")[0]}`), { status: res.status });
  }
}

async function listChildren(blockId: string): Promise<RawBlock[]> {
  const out: RawBlock[] = [];
  let cursor: string | undefined;
  do {
    const qs = `?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const data = await notionGet<{ results: RawBlock[]; has_more: boolean; next_cursor: string | null }>(`/blocks/${blockId}/children${qs}`);
    out.push(...(data.results ?? []));
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

// ─── Conversione ──────────────────────────────────────────────────

function toSpans(rich: RawBlock[] | undefined): RichSpan[] {
  return (rich ?? [])
    .map((r: RawBlock): RichSpan => {
      const a = r.annotations ?? {};
      const span: RichSpan = { text: String(r.plain_text ?? "") };
      const href = r.href ?? r.text?.link?.url;
      if (href && /^https?:\/\//i.test(href)) span.href = href;
      if (a.bold) span.bold = true;
      if (a.italic) span.italic = true;
      if (a.strikethrough) span.strike = true;
      if (a.code) span.code = true;
      return span;
    })
    .filter((s) => s.text.length > 0);
}

async function convertChildren(blockId: string, depth: number): Promise<ContentBlock[]> {
  const raw = await listChildren(blockId);
  const converted = await Promise.all(raw.map((b) => convertBlock(b, depth)));
  return converted.flat();
}

async function convertBlock(b: RawBlock, depth: number): Promise<ContentBlock[]> {
  const type = b.type as string;

  // Note AI di Notion: riassunto e note sì, trascrizione integrale no
  if (type === "transcription") {
    const ids = b.transcription?.children ?? {};
    let sections: string[] = [ids.summary_block_id, ids.notes_block_id].filter(Boolean);
    if (sections.length === 0 && b.has_children) {
      // Formato senza riferimenti espliciti: i figli sono riassunto, note, trascrizione
      sections = (await listChildren(b.id)).slice(0, 2).map((c: RawBlock) => c.id);
    }
    const parts = await Promise.all(sections.map((id) => convertChildren(id, depth + 1)));
    return parts.flat();
  }

  if (type === "divider") return [{ type: "divider" }];

  if (type === "code") {
    return [{ type: "code", spans: toSpans(b.code?.rich_text), language: b.code?.language ?? undefined }];
  }

  if (type === "table") {
    const rows = b.has_children ? await listChildren(b.id) : [];
    return [{
      type: "table",
      header: b.table?.has_column_header === true,
      rows: rows
        .filter((r: RawBlock) => r.type === "table_row")
        .map((r: RawBlock) => (r.table_row?.cells ?? []).map((cell: RawBlock[]) => toSpans(cell))),
    }];
  }

  if (type === "image") {
    const url = b.image?.type === "external" ? b.image.external?.url : b.image?.file?.url;
    return url ? [{ type: "image", url, spans: toSpans(b.image?.caption) }] : [];
  }

  if (!TEXT_TYPES.has(type as ContentBlockType)) return [];

  const body = b[type] ?? {};
  const node: ContentBlock = { type: type as ContentBlockType, spans: toSpans(body.rich_text) };
  if (type === "to_do") node.checked = body.checked === true;
  if (b.has_children && depth < MAX_DEPTH) {
    const children = await convertChildren(b.id, depth + 1);
    if (children.length) node.children = children;
  }
  // Paragrafi vuoti: solo spaziatura in Notion
  if (type === "paragraph" && !node.spans?.length && !node.children?.length) return [];
  return [node];
}

/**
 * Vero se la pagina ha contenuto da mostrare: legge solo i primi blocchi,
 * ignorando i paragrafi vuoti che Notion lascia come spaziatura.
 */
export async function hasPageContent(pageId: string): Promise<boolean> {
  const data = await notionGet<{ results: RawBlock[] }>(`/blocks/${pageId}/children?page_size=10`);
  return (data.results ?? []).some((b: RawBlock) => {
    if (b.type !== "paragraph") return b.type !== "child_page" && b.type !== "child_database";
    return b.has_children || (b.paragraph?.rich_text ?? []).some((r: RawBlock) => String(r.plain_text ?? "").trim());
  });
}

/** Blocchi di una pagina, già convertiti. Le sottopagine e i database inline non sono inclusi. */
export async function fetchPageBlocks(pageId: string): Promise<ContentBlock[]> {
  return convertChildren(pageId, 0);
}
