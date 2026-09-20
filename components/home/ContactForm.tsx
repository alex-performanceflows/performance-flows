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
    <section id="contatto" className="grain relative bg-[#0b1152] overflow-hidden py-24 md:py-36">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 0%, rgba(196,123,34,0.14) 0%, transparent 60%), linear-gradient(180deg, #0b1152 0%, #0a0f42 100%)",
        }}
      />
      {/* Trama di punti finissima: dà materia al fondo senza disegnare nulla */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-[76rem] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-20 items-center">

          {/* Left: copy */}
          <ScrollReveal>
            <div className="text-white">
              <div className="flex items-center gap-4 mb-6">
                <span className="h-px w-8 bg-brand-orange/70" aria-hidden="true" />
                <p className="eyebrow text-brand-orange">Parliamone</p>
              </div>
              <h2 className="display-2 mb-7">
                Raccontaci del tuo progetto
              </h2>
              <p className="lead text-white/60 mb-10">
                Compila il form e ti ricontattiamo entro 24 ore. Ci serve capire dove sei
                oggi per dirti con onestà se possiamo esserti utili.
              </p>
              <ul className="border-t border-[color:var(--rule-invert)]">
                {[
                  "Una call 1:1 di 30 minuti, senza slide",
                  "Guardiamo insieme numeri, margini e campagne",
                  "Ti diciamo dove lasci profitto sul tavolo",
                  "Se non c'è fit, te lo diciamo subito",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4 py-3.5 border-b border-[color:var(--rule-invert)] text-white/75">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal delay={0.15}>
            {status === "success" ? (
              <div className="bg-white rounded-xl p-10 text-center border border-black/5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.6)]">
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
                className="bg-white rounded-xl border border-black/5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.6)] p-8 space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Nome e Cognome *
                    </label>
                    <input
                      {...register("name", { required: true })}
                      type="text"
                      placeholder="Mario Rossi"
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 transition ${errors.name ? "border-red-300" : "border-[color:var(--rule-strong)]"}`}
                    />
                  </div>

                  <div>
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Email *
                    </label>
                    <input
                      {...register("email", { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                      type="email"
                      placeholder="mario@tuonegozio.it"
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 transition ${errors.email ? "border-red-300" : "border-[color:var(--rule-strong)]"}`}
                    />
                  </div>

                  <div>
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Telefono
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      placeholder="+39 333 000 0000"
                      className="w-full border border-[color:var(--rule-strong)] rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 transition"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Nome della tua attività *
                    </label>
                    <input
                      {...register("business", { required: true })}
                      type="text"
                      placeholder="Il tuo negozio o brand"
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 transition ${errors.business ? "border-red-300" : "border-[color:var(--rule-strong)]"}`}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Il tuo store è su che piattaforma? *
                    </label>
                    <select
                      {...register("platform", { required: true })}
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 bg-white transition ${errors.platform ? "border-red-300" : "border-[color:var(--rule-strong)]"}`}
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
                    <label className="block eyebrow text-brand-text-light mb-2">
                      Spesa mensile in advertising *
                    </label>
                    <select
                      {...register("budget", { required: true })}
                      className={`w-full border rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/60 bg-white transition ${errors.budget ? "border-red-300" : "border-[color:var(--rule-strong)]"}`}
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
                  className="btn-sweep arrow-slide w-full bg-brand-orange text-white font-semibold py-4 rounded-full transition-colors disabled:opacity-60 text-[15px] flex items-center justify-center gap-3"
                >
                  {status === "loading" ? (
                    <span>Invio in corso...</span>
                  ) : (
                    <>
                      <span>Raccontaci del tuo progetto</span>
                      <svg className="arrow w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
