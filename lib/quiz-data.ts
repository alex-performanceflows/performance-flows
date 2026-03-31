export interface QuizQuestion {
  question: string;
  answers: { text: string; value: number }[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    question:
      "Se le persone cercano i tuoi prodotti, il tuo store compare tra i primi risultati?",
    answers: [
      { text: "No", value: 0 },
      { text: "A volte", value: 1 },
      { text: "Sì, di solito", value: 2 },
      { text: "Sì, e ricevo acquisti da ricerche organiche", value: 3 },
    ],
  },
  {
    question:
      "I titoli dei prodotti sono pensati per essere trovati facilmente?",
    answers: [
      { text: "Generici/fornitore", value: 0 },
      { text: "Parzialmente ottimizzati", value: 1 },
      { text: "Unici e descrittivi", value: 2 },
      { text: "Unici + orientati ai benefici + FAQ", value: 3 },
    ],
  },
  {
    question: "Recupero carrelli e abbandono navigazione sono attivi?",
    answers: [
      { text: "No", value: 0 },
      { text: "Solo email", value: 1 },
      { text: "Email + SMS / Push", value: 2 },
      { text: "Flussi completi + test A/B", value: 3 },
    ],
  },
  {
    question:
      "Le automazioni email sono attive? (welcome, post-purchase, win-back)",
    answers: [
      { text: "No", value: 0 },
      { text: "Minime", value: 1 },
      { text: "Diverse attive", value: 2 },
      { text: "Suite completa + segmenti", value: 3 },
    ],
  },
  {
    question:
      "Hai metodi di pagamento \"fast\" attivi (Apple/Google Pay, PayPal, BNPL)?",
    answers: [
      { text: "Quasi nulla", value: 0 },
      { text: "Solo classici (carta di credito / bonifico)", value: 1 },
      { text: "Buona copertura dei diversi metodi", value: 2 },
      { text: "Ho tutti i metodi più moderni", value: 3 },
    ],
  },
  {
    question: "Il blog porta traffico \"che compra\"?",
    answers: [
      { text: "Non lo usiamo", value: 0 },
      { text: "Facciamo post saltuari", value: 1 },
      { text: "Abbiamo un piano editoriale attivo", value: 2 },
      {
        text: "Abbiamo un piano basato su keyword + interlink verso categorie/prodotti",
        value: 3,
      },
    ],
  },
  {
    question:
      "Hai fatto un check SEO tecnico negli ultimi 6 mesi (404, redirect, sitemap)?",
    answers: [
      { text: "Mai", value: 0 },
      { text: "Tempo fa", value: 1 },
      { text: "Sì, un controllo di base", value: 2 },
      { text: "Sì, monitoriamo tutto", value: 3 },
    ],
  },
  {
    question: "Sai da dove arrivano le vendite in termini di canale?",
    answers: [
      { text: "No", value: 0 },
      { text: "A spanne", value: 1 },
      { text: "Ho un report base", value: 2 },
      { text: "Ho report chiari e completi", value: 3 },
    ],
  },
  {
    question:
      "Gli acquisti sono tracciati in modo affidabile (GA4 / Google Ads)?",
    answers: [
      { text: "I numeri non tornano mai", value: 0 },
      { text: "I numeri non tornano a volte", value: 1 },
      { text: "Le piattaforme sono abbastanza allineate", value: 2 },
      { text: "Tutto è monitorato alla perfezione", value: 3 },
    ],
  },
  {
    question: "Il tuo Shopify è ottimizzato per i dispositivi mobile?",
    answers: [
      { text: "Purtroppo no", value: 0 },
      { text: "Ottimizzato ma migliorabile", value: 1 },
      { text: "Molto ottimizzato", value: 2 },
      { text: "È stato disegnato mobile-first", value: 3 },
    ],
  },
  {
    question: "Conosci il profitto netto per ogni singolo prodotto?",
    answers: [
      { text: "No", value: 0 },
      { text: "Sì, a sensazione", value: 1 },
      { text: "Sì, ma tengo conto solo del fatturato", value: 2 },
      { text: "Sì, monitoro il profitto finale", value: 3 },
    ],
  },
  {
    question:
      "Il tuo store ha recensioni positive su piattaforme conosciute (Google Reviews / Trustpilot)?",
    answers: [
      { text: "Non siamo presenti / non ne abbiamo ancora", value: 0 },
      { text: "Sì, ma il punteggio è basso", value: 1 },
      { text: "Sì, con un buon punteggio", value: 2 },
      {
        text: "Sì, punteggio ottimo e invitiamo tutti i clienti a lasciare una recensione",
        value: 3,
      },
    ],
  },
  {
    question:
      "Cosa pensi dell'acquisizione clienti tramite pubblicità online?",
    answers: [
      { text: "Non mi interessa al momento", value: 0 },
      {
        text: "Mi piacerebbe fare una prova, non so il budget",
        value: 1,
      },
      { text: "Lo sto facendo ma senza obiettivi chiari", value: 2 },
      {
        text: "Lo sto facendo, con budget e obiettivi di crescita definiti",
        value: 3,
      },
    ],
  },
  {
    question:
      "Stock, customer care e logistica reggerebbero un aumento di ordini?",
    answers: [
      { text: "No", value: 0 },
      { text: "A fatica", value: 1 },
      { text: "Abbastanza bene", value: 2 },
      { text: "Ho dei processi molto fluidi", value: 3 },
    ],
  },
  {
    question: "Il customer care in quanto tempo risponde ai clienti?",
    answers: [
      { text: "Non monitoriamo le risposte", value: 0 },
      { text: "Entro 24-48h", value: 1 },
      { text: "Entro 4-12h", value: 2 },
      { text: "<1h (live chat / WhatsApp)", value: 3 },
    ],
  },
];

export const MAX_SCORE = quizQuestions.length * 3; // 45

export function getScoreLevel(score: number): {
  level: string;
  color: string;
  message: string;
} {
  const percentage = (score / MAX_SCORE) * 100;

  if (percentage <= 33) {
    return {
      level: "Base",
      color: "text-red-500",
      message:
        "Il tuo store Shopify ha molte aree di miglioramento. Con le giuste ottimizzazioni su tracking, advertising e automazioni, puoi sbloccare una crescita significativa del profitto.",
    };
  }
  if (percentage <= 66) {
    return {
      level: "Intermedio",
      color: "text-brand-orange",
      message:
        "Hai delle buone basi, ma ci sono opportunità importanti ancora non sfruttate. Lavorando su CRO, automazioni e una strategia ads orientata al profitto, puoi fare un salto di qualità.",
    };
  }
  return {
    level: "Avanzato",
    color: "text-green-500",
    message:
      "Il tuo store è ben strutturato. Per portarlo al livello successivo, servono ottimizzazioni avanzate: scaling controllato, unit economics raffinati e test continui.",
  };
}
