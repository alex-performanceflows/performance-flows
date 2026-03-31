import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prenota una Consulenza | Performance Flows",
  description:
    "Prenota una call conoscitiva gratuita con Performance Flows. Analizzeremo il tuo e-commerce Shopify e valuteremo come il metodo ProfitFlow™ può aiutarti a scalare.",
};

export default function ConsulenzaPage() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue mb-4">
          Prenota una consulenza gratuita
        </h1>
        <p className="text-brand-text-light text-lg mb-10 max-w-xl mx-auto">
          Scegli il giorno e l&apos;orario che preferisci. Ti ricontatteremo per
          una sessione 1:1 dove analizzeremo il tuo e-commerce Shopify.
        </p>

        {/* Calendly embed placeholder */}
        <div className="bg-brand-gray rounded-2xl p-12 border-2 border-dashed border-gray-300">
          <p className="text-brand-text-light text-lg mb-4">
            Qui verrà inserito il widget Calendly
          </p>
          <p className="text-sm text-brand-text-light">
            Per attivarlo, aggiungi il tuo link Calendly al componente.
          </p>
          {/*
            Per integrare Calendly, sostituisci questo div con:
            <iframe
              src="https://calendly.com/TUO-LINK"
              width="100%"
              height="700"
              frameBorder="0"
            />
          */}
        </div>
      </div>
    </section>
  );
}
