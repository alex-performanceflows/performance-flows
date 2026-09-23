/**
 * Trasforma il topojson del mondo (Natural Earth 110m) in un modulo TS con
 * un path SVG per paese, gia' proiettato. Cosi' la dashboard disegna la
 * mappa senza portarsi dietro una libreria di mappe.
 *
 * Proiezione: Equal Earth (Savric, Patterson, Jenny 2018) - equivalente,
 * quindi le aree sono confrontabili, e di aspetto moderno.
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = process.argv[2];
const OUT = process.argv[3];
const topo = JSON.parse(readFileSync(SRC, "utf8"));

// ── decodifica topojson ────────────────────────────────────────────
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});
function arcoPunti(i) {
  return i < 0 ? arcs[~i].slice().reverse() : arcs[i];
}
function anello(indici) {
  const out = [];
  for (const i of indici) {
    const p = arcoPunti(i);
    for (let k = out.length ? 1 : 0; k < p.length; k++) out.push(p[k]);
  }
  return out;
}

// ── proiezione Equal Earth ─────────────────────────────────────────
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;
function equalEarth(lon, lat) {
  const l = (lon * Math.PI) / 180, f = (lat * Math.PI) / 180;
  const t = Math.asin(M * Math.sin(f));
  const t2 = t * t, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(t)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}
// estremi della proiezione, per normalizzare dentro la viewBox
const [X_MAX] = equalEarth(180, 0);
const [, Y_MAX] = equalEarth(0, 90);

const W = 1000;
const H = Math.round((W * Y_MAX) / X_MAX);
function proietta(lon, lat) {
  const [x, y] = equalEarth(lon, lat);
  return [
    ((x / X_MAX + 1) / 2) * W,
    ((1 - y / Y_MAX) / 2) * H,
  ];
}

// ── area di un anello, per buttare via le isole invisibili ─────────
function area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return Math.abs(a / 2);
}

const AREA_MINIMA = 0.9; // px² sulla viewBox da 1000: sotto non si vede

let scartati = 0;
const bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };

/**
 * Un anello che attraversa l'antimeridiano (Figi, le Chukotka russe) ha punti
 * a +179 e a -179: proiettandoli si ottiene una riga orizzontale che taglia in
 * due il planisfero. Nessun paese vero copre mezzo globo in un anello solo,
 * quindi lo scarto è sicuro.
 */
function attraversaIlBordo(ring) {
  let min = Infinity, max = -Infinity;
  for (const [lon] of ring) { if (lon < min) min = lon; if (lon > max) max = lon; }
  return max - min > 180;
}

function ringToPath(ring) {
  if (attraversaIlBordo(ring)) { scartati++; return ""; }
  const proj = ring.map(([lon, lat]) => proietta(lon, lat));
  if (area(proj) < AREA_MINIMA) return "";
  const out = [];
  let px = null, py = null;
  for (const [x, y] of proj) {
    const rx = Math.round(x), ry = Math.round(y);
    if (rx === px && ry === py) continue;
    out.push([rx, ry]);
    px = rx; py = ry;
  }
  if (out.length < 4) return "";
  for (const [x, y] of out) {
    if (x < bounds.x0) bounds.x0 = x;
    if (y < bounds.y0) bounds.y0 = y;
    if (x > bounds.x1) bounds.x1 = x;
    if (y > bounds.y1) bounds.y1 = y;
  }
  let d = `M${out[0][0]} ${out[0][1]}`;
  for (let i = 1; i < out.length; i++) d += `L${out[i][0]} ${out[i][1]}`;
  return d + "Z";
}

function geometriaToPath(g) {
  const poligoni = g.type === "Polygon" ? [g.arcs] : g.arcs;
  let d = "";
  for (const poly of poligoni) for (const ring of poly) d += ringToPath(anello(ring));
  return d;
}

// ── nome inglese → ISO-2, via Intl ─────────────────────────────────
const ISO2 = [];
for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
  ISO2.push(String.fromCharCode(a) + String.fromCharCode(b));
}
/**
 * Codici ISO 3166-3: paesi che non esistono più o sigle tenute in vita come
 * sinonimo. Intl dà loro lo stesso nome del codice attuale (DD e DE sono
 * entrambi "Germany", UK e GB "United Kingdom"), quindi senza escluderli il
 * path finirebbe sotto una sigla che nessuna piattaforma manda mai.
 * Elenco ricavato cercando i nomi serviti da più di un codice.
 */
const OBSOLETI = new Set([
  "AN", "BU", "CS", "DD", "DY", "FX", "HV", "NH", "RH", "SU", "TP", "UK", "VD", "YD", "YU", "ZR",
]);

const dn = new Intl.DisplayNames(["en"], { type: "region" });
const perNome = new Map();
const codici = [];
for (const c of ISO2) {
  if (OBSOLETI.has(c)) continue;
  let nome;
  try { nome = dn.of(c); } catch { continue; }
  if (!nome || nome === c) continue;
  codici.push(c);
  perNome.set(nome.toLowerCase(), c);
}

// Natural Earth usa nomi suoi per un pugno di paesi
const ALIAS = {
  "united states of america": "US", "dem. rep. congo": "CD", "congo": "CG",
  "central african rep.": "CF", "s. sudan": "SS", "dominican rep.": "DO",
  "eq. guinea": "GQ", "w. sahara": "EH", "czechia": "CZ", "bosnia and herz.": "BA",
  "north macedonia": "MK", "côte d'ivoire": "CI", "cote d'ivoire": "CI",
  "solomon is.": "SB", "falkland is.": "FK", "fr. s. antarctic lands": "TF",
  "n. cyprus": "CY", "somaliland": "SO", "kosovo": "XK", "swaziland": "SZ",
  "eswatini": "SZ", "myanmar": "MM", "laos": "LA", "vietnam": "VN",
  "south korea": "KR", "north korea": "KP", "russia": "RU", "iran": "IR",
  "syria": "SY", "venezuela": "VE", "bolivia": "BO", "tanzania": "TZ",
  "moldova": "MD", "brunei": "BN", "taiwan": "TW", "turkey": "TR",
  "cape verde": "CV", "antarctica": "AQ", "greenland": "GL",
  "palestine": "PS", "macedonia": "MK", "trinidad and tobago": "TT",
};

const paths = {};
const resti = [];
let senzaCodice = [];
for (const g of topo.objects.countries.geometries) {
  const nome = String(g.properties?.name ?? "");
  const chiave = nome.toLowerCase();
  if (chiave === "antarctica") continue; // banda vuota in fondo, nessun dato
  const iso = ALIAS[chiave] ?? perNome.get(chiave);
  const d = geometriaToPath(g);
  if (!d) continue;
  if (iso) paths[iso] = (paths[iso] ?? "") + d;
  else { resti.push(d); senzaCodice.push(nome); }
}

const righe = Object.keys(paths).sort().map((k) => `  ${k}: "${paths[k]}",`).join("\n");
const ts = `// GENERATO da scripts/genera-mappa.mjs - non modificare a mano.
// Mondo Natural Earth 110m proiettato in Equal Earth. Chiave: codice ISO-3166-1 alpha-2.
export const MAPPA_VIEWBOX = "${bounds.x0 - 2} ${bounds.y0 - 2} ${bounds.x1 - bounds.x0 + 4} ${bounds.y1 - bounds.y0 + 4}";

/** Paesi senza codice ISO nella sorgente: sfondo e basta. */
export const MAPPA_RESTO = "${resti.join("")}";

export const MAPPA_PAESI: Record<string, string> = {
${righe}
};

/** Codici ISO-2 noti, per risalire dal nome inglese di GA4 al codice. */
export const ISO2_NOTI = ${JSON.stringify(codici)};
`;

writeFileSync(OUT, ts);
console.log("paesi con codice:", Object.keys(paths).length);
console.log("senza codice:", senzaCodice.join(", ") || "nessuno");
console.log("anelli scartati (antimeridiano):", scartati);
console.log("viewBox:", W, "x", H);
console.log("dimensione:", (ts.length / 1024).toFixed(1), "KB");
