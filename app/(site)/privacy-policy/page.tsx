import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, H3, P, UL, Table } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | Performance Flows",
  description:
    "Informativa sul trattamento dei dati personali di Performance Flows ai sensi degli artt. 13 e 14 del Regolamento UE 2016/679 (GDPR).",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://performanceflows.com/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="15 settembre 2026">
      <P>
        Questa informativa descrive come Performance Flows tratta i dati personali di chi
        visita il sito performanceflows.com e di chi ci contatta, ai sensi degli articoli
        13 e 14 del Regolamento UE 2016/679 (GDPR).
      </P>

      <H2>1. Titolare del trattamento</H2>
      <P>
        Il titolare del trattamento è <strong>Performance Flows</strong>, con sede in Via
        Dotti 29, 31100 Treviso (TV), Italia, P.IVA 05527760267.
        <br />
        Per qualsiasi questione relativa ai tuoi dati puoi scrivere a{" "}
        <a
          href="mailto:alex@performanceflows.com"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          alex@performanceflows.com
        </a>
        .
      </P>
      <P>
        Non abbiamo nominato un Responsabile della Protezione dei Dati (DPO), non
        ricorrendone i presupposti dell&apos;art. 37 GDPR.
      </P>

      <H2>2. Quali dati raccogliamo e perché</H2>

      <H3>2.1 Dati che ci fornisci tu</H3>
      <P>
        Quando compili il modulo di contatto raccogliamo: nome e cognome, indirizzo email,
        numero di telefono (facoltativo), nome della tua attività, piattaforma
        e-commerce utilizzata e fascia di spesa pubblicitaria mensile.
      </P>
      <P>
        Quando compili il questionario &ldquo;Indice di Scalabilità Shopify&rdquo;
        raccogliamo: nome, indirizzo email, numero di telefono, indirizzo del sito web e
        le risposte che fornisci.
      </P>

      <H3>2.2 Dati raccolti automaticamente</H3>
      <P>
        Se presti il consenso, raccogliamo dati statistici di navigazione tramite Google
        Analytics 4: pagine visitate, durata della visita, provenienza del traffico, tipo
        di dispositivo e browser, dati di geolocalizzazione approssimativa a livello di
        città. L&apos;indirizzo IP viene anonimizzato da Google prima della
        memorizzazione. Senza il tuo consenso questi strumenti non vengono attivati. Per
        i dettagli vedi la{" "}
        <Link
          href="/cookie-policy"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          Cookie Policy
        </Link>
        .
      </P>
      <P>
        I server che ospitano il sito registrano inoltre log tecnici (indirizzo IP, data e
        ora della richiesta, pagina richiesta) per finalità di sicurezza e diagnostica.
      </P>

      <H2>3. Finalità e basi giuridiche</H2>
      <Table
        head={["Finalità", "Dati trattati", "Base giuridica", "Conservazione"]}
        rows={[
          [
            "Rispondere alla tua richiesta e valutare un possibile rapporto di collaborazione",
            "Dati del modulo di contatto e del questionario",
            "Esecuzione di misure precontrattuali su tua richiesta (art. 6.1.b GDPR)",
            "24 mesi dall'ultimo contatto",
          ],
          [
            "Analisi statistica dell'utilizzo del sito",
            "Dati di navigazione tramite Google Analytics 4",
            "Tuo consenso (art. 6.1.a GDPR), revocabile in ogni momento",
            "14 mesi",
          ],
          [
            "Sicurezza del sito e prevenzione degli abusi",
            "Log tecnici del server",
            "Legittimo interesse del titolare (art. 6.1.f GDPR)",
            "Massimo 12 mesi",
          ],
          [
            "Adempimento di obblighi fiscali e contabili, difesa in giudizio",
            "Dati identificativi e di fatturazione",
            "Obbligo di legge (art. 6.1.c GDPR)",
            "10 anni, come da normativa",
          ],
        ]}
      />
      <P>
        Il conferimento dei dati contrassegnati come obbligatori nei moduli è necessario
        per darti risposta: senza di essi non possiamo evadere la richiesta. Il
        conferimento degli altri dati è facoltativo.
      </P>

      <H2>4. A chi comunichiamo i dati</H2>
      <P>
        I tuoi dati sono accessibili al personale autorizzato di Performance Flows e ai
        fornitori che trattano dati per nostro conto in qualità di responsabili del
        trattamento (art. 28 GDPR):
      </P>
      <Table
        head={["Fornitore", "Servizio", "Sede"]}
        rows={[
          ["Vercel Inc.", "Hosting del sito web", "Stati Uniti"],
          ["Resend, Inc.", "Invio delle email generate dai moduli", "Stati Uniti"],
          ["Notion Labs, Inc.", "Archiviazione delle richieste ricevute", "Stati Uniti"],
          ["Google Ireland Ltd.", "Statistiche di navigazione (Google Analytics 4)", "Irlanda / Stati Uniti"],
        ]}
      />
      <P>
        I dati non sono oggetto di diffusione né di vendita a terzi. Possono essere
        comunicati ad autorità pubbliche quando previsto dalla legge.
      </P>

      <H2>5. Trasferimenti fuori dall&apos;Unione Europea</H2>
      <P>
        Alcuni fornitori hanno sede negli Stati Uniti. I trasferimenti avvengono sulla
        base di garanzie adeguate ai sensi del Capo V del GDPR: clausole contrattuali
        standard approvate dalla Commissione Europea e, ove applicabile, adesione del
        fornitore al Data Privacy Framework UE-USA. Puoi richiederci copia delle garanzie
        adottate scrivendo all&apos;indirizzo indicato al punto 1.
      </P>

      <H2>6. I tuoi diritti</H2>
      <P>
        In qualunque momento puoi esercitare i diritti previsti dagli articoli da 15 a 22
        del GDPR:
      </P>
      <UL>
        <li>accedere ai tuoi dati e ottenerne copia;</li>
        <li>chiederne la rettifica se inesatti o incompleti;</li>
        <li>chiederne la cancellazione, nei casi previsti dalla legge;</li>
        <li>chiedere la limitazione del trattamento;</li>
        <li>ricevere i tuoi dati in formato strutturato e leggibile da dispositivo automatico (portabilità);</li>
        <li>opporti al trattamento fondato sul legittimo interesse;</li>
        <li>revocare il consenso in qualsiasi momento, senza che ciò pregiudichi la liceità del trattamento effettuato prima della revoca.</li>
      </UL>
      <P>
        Per esercitarli scrivi a{" "}
        <a
          href="mailto:alex@performanceflows.com"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          alex@performanceflows.com
        </a>
        . Ti risponderemo entro un mese dalla richiesta.
      </P>
      <P>
        Se ritieni che il trattamento violi la normativa, hai diritto di proporre reclamo
        al Garante per la protezione dei dati personali (Piazza Venezia 11, 00187 Roma,{" "}
        <a
          href="https://www.garanteprivacy.it"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          garanteprivacy.it
        </a>
        ) oppure di ricorrere all&apos;autorità giudiziaria.
      </P>

      <H2>7. Processi decisionali automatizzati</H2>
      <P>
        Non effettuiamo processi decisionali interamente automatizzati né attività di
        profilazione che producano effetti giuridici sulla tua persona. Il punteggio
        prodotto dal questionario &ldquo;Indice di Scalabilità Shopify&rdquo; è un
        indicatore informativo basato sulle risposte che fornisci e non determina da solo
        alcuna decisione nei tuoi confronti.
      </P>

      <H2>8. Sicurezza</H2>
      <P>
        Adottiamo misure tecniche e organizzative adeguate a proteggere i dati da accessi
        non autorizzati, perdita e divulgazione: connessione cifrata TLS su tutto il sito,
        accessi limitati al personale autorizzato e autenticazione a più fattori sui
        sistemi che contengono dati personali.
      </P>

      <H2>9. Modifiche a questa informativa</H2>
      <P>
        Possiamo aggiornare questa informativa per adeguarla a cambiamenti normativi o ai
        servizi utilizzati. La versione in vigore è sempre quella pubblicata su questa
        pagina, con la data di aggiornamento indicata in alto.
      </P>
    </LegalPage>
  );
}
