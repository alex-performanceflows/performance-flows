// WooCommerce salva la provincia italiana con la sigla: qui la si rende leggibile
// e la si raggruppa per regione, che è il taglio utile per le spedizioni.

export const PROVINCIA: Record<string, string> = {
  AG: "Agrigento", AL: "Alessandria", AN: "Ancona", AO: "Aosta", AP: "Ascoli Piceno", AQ: "L'Aquila",
  AR: "Arezzo", AT: "Asti", AV: "Avellino", BA: "Bari", BG: "Bergamo", BI: "Biella", BL: "Belluno",
  BN: "Benevento", BO: "Bologna", BR: "Brindisi", BS: "Brescia", BT: "Barletta-Andria-Trani",
  BZ: "Bolzano", CA: "Cagliari", CB: "Campobasso", CE: "Caserta", CH: "Chieti", CL: "Caltanissetta",
  CN: "Cuneo", CO: "Como", CR: "Cremona", CS: "Cosenza", CT: "Catania", CZ: "Catanzaro", EN: "Enna",
  FC: "Forlì-Cesena", FE: "Ferrara", FG: "Foggia", FI: "Firenze", FM: "Fermo", FR: "Frosinone",
  GE: "Genova", GO: "Gorizia", GR: "Grosseto", IM: "Imperia", IS: "Isernia", KR: "Crotone",
  LC: "Lecco", LE: "Lecce", LI: "Livorno", LO: "Lodi", LT: "Latina", LU: "Lucca", MB: "Monza e Brianza",
  MC: "Macerata", ME: "Messina", MI: "Milano", MN: "Mantova", MO: "Modena", MS: "Massa-Carrara",
  MT: "Matera", NA: "Napoli", NO: "Novara", NU: "Nuoro", OR: "Oristano", PA: "Palermo", PC: "Piacenza",
  PD: "Padova", PE: "Pescara", PG: "Perugia", PI: "Pisa", PN: "Pordenone", PO: "Prato", PR: "Parma",
  PT: "Pistoia", PU: "Pesaro e Urbino", PV: "Pavia", PZ: "Potenza", RA: "Ravenna", RC: "Reggio Calabria",
  RE: "Reggio Emilia", RG: "Ragusa", RI: "Rieti", RM: "Roma", RN: "Rimini", RO: "Rovigo", SA: "Salerno",
  SI: "Siena", SO: "Sondrio", SP: "La Spezia", SR: "Siracusa", SS: "Sassari", SU: "Sud Sardegna",
  SV: "Savona", TA: "Taranto", TE: "Teramo", TN: "Trento", TO: "Torino", TP: "Trapani", TR: "Terni",
  TS: "Trieste", TV: "Treviso", UD: "Udine", VA: "Varese", VB: "Verbano-Cusio-Ossola", VC: "Vercelli",
  VE: "Venezia", VI: "Vicenza", VR: "Verona", VT: "Viterbo", VV: "Vibo Valentia",
};

const REGIONE_DI: Record<string, string> = {
  Abruzzo: "AQ CH PE TE", Basilicata: "MT PZ", Calabria: "CS CZ KR RC VV",
  Campania: "AV BN CE NA SA", "Emilia-Romagna": "BO FC FE MO PC PR RA RE RN",
  "Friuli-Venezia Giulia": "GO PN TS UD", Lazio: "FR LT RI RM VT", Liguria: "GE IM SP SV",
  Lombardia: "BG BS CO CR LC LO MB MI MN PV SO VA", Marche: "AN AP FM MC PU",
  Molise: "CB IS", Piemonte: "AL AT BI CN NO TO VB VC", Puglia: "BA BR BT FG LE TA",
  Sardegna: "CA NU OR SS SU", Sicilia: "AG CL CT EN ME PA RG SR TP",
  Toscana: "AR FI GR LI LU MS PI PO PT SI", "Trentino-Alto Adige": "BZ TN",
  Umbria: "PG TR", "Valle d'Aosta": "AO", Veneto: "BL PD RO TV VE VI VR",
};

const SIGLA_REGIONE: Record<string, string> = Object.entries(REGIONE_DI)
  .flatMap(([reg, sigle]) => sigle.split(" ").map((s) => [s, reg] as const))
  .reduce((acc, [s, reg]) => { acc[s] = reg; return acc; }, {} as Record<string, string>);

export function nomeProvincia(sigla: string): string {
  const k = sigla.trim().toUpperCase();
  return PROVINCIA[k] ?? (k || "Non indicata");
}

export function nomeRegione(sigla: string): string {
  const k = sigla.trim().toUpperCase();
  return SIGLA_REGIONE[k] ?? (k ? "Estero o non indicata" : "Non indicata");
}
