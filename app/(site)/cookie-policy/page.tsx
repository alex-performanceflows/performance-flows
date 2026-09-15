import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, H2, P, UL, Table } from "@/components/legal/LegalLayout";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";

export const metadata: Metadata = {
  title: "Cookie Policy | Performance Flows",
  description:
    "Informativa sui cookie utilizzati da performanceflows.com: cookie tecnici, cookie analitici e come gestire le tue preferenze.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://performanceflows.com/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="15 settembre 2026">
      <P>
        Questa pagina spiega quali cookie e tecnologie simili utilizza
        performanceflows.com, a cosa servono e come puoi gestirli. Per il trattamento dei
        dati personali in generale vedi la{" "}
        <Link
          href="/privacy-policy"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          Privacy Policy
        </Link>
        .
      </P>

      <H2>1. Cosa sono i cookie</H2>
      <P>
        I cookie sono piccoli file di testo che i siti salvano sul tuo dispositivo per
        memorizzare informazioni tra una visita e l&apos;altra. Accanto ai cookie
        esistono tecnologie analoghe, come il localStorage del browser, che funzionano
        allo stesso modo: anche queste sono coperte da questa informativa.
      </P>

      <H2>2. Cookie tecnici necessari</H2>
      <P>
        Servono al funzionamento del sito e alla memorizzazione delle tue scelte. Non
        richiedono consenso, ai sensi dell&apos;art. 122 del Codice Privacy e delle Linee
        guida cookie del Garante del 10 giugno 2021.
      </P>
      <Table
        head={["Nome", "Tipo", "Finalità", "Durata"]}
        rows={[
          [
            "pf_cookie_consent",
            "localStorage (prima parte)",
            "Memorizza la tua scelta sui cookie analitici, per non richiedertela a ogni visita",
            "12 mesi",
          ],
        ]}
      />

      <H2>3. Cookie analitici di terza parte</H2>
      <P>
        Vengono attivati <strong>solo dopo il tuo consenso</strong> e ci servono a capire
        in forma aggregata come viene usato il sito: quali pagine funzionano, da dove
        arrivano i visitatori, dove si interrompe la navigazione. Se rifiuti, questi
        strumenti non vengono caricati e nessun cookie analitico viene scritto.
      </P>
      <Table
        head={["Nome", "Fornitore", "Finalità", "Durata"]}
        rows={[
          ["_ga", "Google Ireland Ltd.", "Distingue i visitatori unici", "2 anni"],
          ["_ga_<container>", "Google Ireland Ltd.", "Mantiene lo stato della sessione di Google Analytics 4", "2 anni"],
        ]}
      />
      <P>
        Google Analytics 4 è configurato con anonimizzazione dell&apos;indirizzo IP e
        senza condivisione dei dati a fini pubblicitari. Puoi consultare l&apos;
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          informativa privacy di Google
        </a>{" "}
        e installare il{" "}
        <a
          href="https://tools.google.com/dlpage/gaoptout"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          componente aggiuntivo per la disattivazione
        </a>{" "}
        se vuoi bloccare Analytics su tutti i siti.
      </P>

      <H2>4. Cosa non usiamo</H2>
      <P>
        Su questo sito non sono attivi cookie di profilazione pubblicitaria, pixel di
        social network (compreso il pixel di Meta), strumenti di retargeting né cookie di
        terze parti diversi da quelli elencati sopra.
      </P>

      <H2>5. Come gestire le tue preferenze</H2>
      <P>
        Puoi cambiare idea quando vuoi. Il pulsante qui sotto riapre il pannello delle
        preferenze e ti consente di prestare o revocare il consenso ai cookie analitici:
      </P>
      <div className="mb-6">
        <CookieSettingsButton />
      </div>
      <P>
        In alternativa puoi gestire o eliminare i cookie dalle impostazioni del tuo
        browser. Ecco le istruzioni ufficiali:
      </P>
      <UL>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-orange transition">Google Chrome</a>
        </li>
        <li>
          <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-orange transition">Mozilla Firefox</a>
        </li>
        <li>
          <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-orange transition">Safari</a>
        </li>
        <li>
          <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline underline-offset-2 hover:text-brand-orange transition">Microsoft Edge</a>
        </li>
      </UL>
      <P>
        Bloccare i cookie tecnici dal browser può compromettere il corretto funzionamento
        di alcune parti del sito.
      </P>

      <H2>6. Titolare e contatti</H2>
      <P>
        Titolare del trattamento è Performance Flows, Via Dotti 29, 31100 Treviso (TV),
        P.IVA 05527760267. Per domande su questa informativa scrivi a{" "}
        <a
          href="mailto:alex@performanceflows.com"
          className="text-brand-blue font-medium underline underline-offset-2 hover:text-brand-orange transition"
        >
          alex@performanceflows.com
        </a>
        .
      </P>
    </LegalPage>
  );
}
