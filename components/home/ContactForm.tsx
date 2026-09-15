"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface FormData {
  name: string;
  email: string;
  business: string;
  phone: string;
  budget: string;
  platform: string;
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const platform = watch("platform");
  const nonShopify = platform === "altro";

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        reset();
        if (typeof window !== "undefined" && window.dataLayer) {
          window.dataLayer.push({ event: "form_submit", form_name: "contact" });
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contatto" className="relative bg-brand-blue overflow-hidden py-16 md:py-24">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <ScrollReveal>
            <div className="text-white">
              <p className="text-brand-orange font-semibold text-sm uppercase tracking-widest mb-4">Parliamone</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Raccontaci del tuo progetto
              </h2>
              <p className="text-blue-200 text-lg mb-8 leading-relaxed">
                Compila il form e ti ricontattiamo entro 24 ore. Ci serve capire dove sei
                oggi per dirti con onestà se possiamo esserti utili.
              </p>
              <ul className="space-y-4">
                {[
                  "Una call 1:1 di 30 minuti, senza slide",
                  "Guardiamo insieme numeri, margini e campagne",
                  "Ti diciamo dove lasci profitto sul tavolo",
                  "Se non c'è fit, te lo diciamo subito",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-blue-100">
                    <span className="w-5 h-5 rounded-full bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-brand-orange" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal delay={0.15}>
            {status === "success" ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-2">Richiesta inviata!</h3>
                <p className="text-brand-text-light text-sm">Ti ricontattiamo entro 24 ore per fissare la call.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-2xl shadow-2xl p-7 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Nome e Cognome *
                    </label>
                    <input
                      {...register("name", { required: true })}
                      type="text"
                      placeholder="Mario Rossi"
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition ${errors.name ? "border-red-300" : "border-gray-200"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Email *
                    </label>
                    <input
                      {...register("email", { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                      type="email"
                      placeholder="mario@tuonegozio.it"
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition ${errors.email ? "border-red-300" : "border-gray-200"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Telefono
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+39 333 000 0000"
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Nome della tua attività *
                    </label>
                    <input
                      {...register("business", { required: true })}
                      type="text"
                      placeholder="Il tuo negozio o brand"
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition ${errors.business ? "border-red-300" : "border-gray-200"}`}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Il tuo store è su che piattaforma? *
                    </label>
                    <select
                      {...register("platform", { required: true })}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition ${errors.platform ? "border-red-300" : "border-gray-200"}`}
                    >
                      <option value="">Seleziona la piattaforma</option>
                      <option value="shopify">Shopify</option>
                      <option value="shopify-plus">Shopify Plus</option>
                      <option value="altro">Altra piattaforma (WooCommerce, Magento, Prestashop…)</option>
                    </select>
                    {nonShopify && (
                      <p className="mt-2 text-xs text-brand-text-light leading-relaxed bg-brand-gray border border-black/[0.06] rounded-lg px-3 py-2.5">
                        Lavoriamo esclusivamente su Shopify: è così che riusciamo ad
                        andare a fondo su feed, checkout e tracking. Puoi comunque
                        scriverci, e se stai valutando una migrazione ne parliamo
                        volentieri.
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-brand-text mb-1.5 uppercase tracking-wide">
                      Spesa mensile in advertising *
                    </label>
                    <select
                      {...register("budget", { required: true })}
                      className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue bg-white transition ${errors.budget ? "border-red-300" : "border-gray-200"}`}
                    >
                      <option value="">Seleziona un range</option>
                      <option value="0-3000">Meno di €3.000</option>
                      <option value="3000-10000">€3.000 – €10.000</option>
                      <option value="10000-50000">€10.000 – €50.000</option>
                      <option value="50000+">€50.000+</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-brand-orange text-white font-bold py-4 rounded-xl hover:bg-brand-orange-light transition-all disabled:opacity-60 text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20"
                >
                  {status === "loading" ? (
                    "Invio in corso..."
                  ) : (
                    <>
                      Raccontaci del tuo progetto
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                {status === "error" && (
                  <p className="text-red-500 text-xs text-center">
                    Si è verificato un errore. Scrivici a alex@performanceflows.com
                  </p>
                )}
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
