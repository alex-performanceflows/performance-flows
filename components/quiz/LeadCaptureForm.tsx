"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

interface LeadData {
  name: string;
  phone: string;
  email: string;
  url: string;
  consent: boolean;
}

export default function LeadCaptureForm({
  onSubmit: onFormSubmit,
}: {
  onSubmit: (data: LeadData) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadData>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: LeadData) => {
    setLoading(true);
    onFormSubmit(data);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-brand-orange/20">
        <h2 className="text-xl font-bold text-brand-text mb-2">
          Dove possiamo inviarti il risultato?
        </h2>
        <p className="text-brand-text-light text-sm mb-6">
          <strong>Ultimo step per il tuo report personalizzato.</strong>
          <br />
          Già usato da decine di proprietari di negozi online come te per capire
          come sbloccare la crescita del fatturato.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1">
              Nome e Cognome *
            </label>
            <input
              {...register("name", { required: true })}
              type="text"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">Campo obbligatorio</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1">
              Telefono *
            </label>
            <input
              {...register("phone", { required: true })}
              type="tel"
              placeholder="+39 .."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">Campo obbligatorio</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1">
              Email *
            </label>
            <input
              {...register("email", {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              })}
              type="email"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">Email non valida</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-text mb-1">
              URL del tuo store
            </label>
            <input
              {...register("url")}
              type="url"
              placeholder="https://tuonegozio.myshopify.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              {...register("consent", { required: true })}
              type="checkbox"
              id="consent"
              className="mt-1"
            />
            <label htmlFor="consent" className="text-xs text-brand-text-light">
              Acconsento al trattamento dei dati personali ai sensi del GDPR.
              {errors.consent && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-white font-semibold py-4 rounded-lg hover:bg-brand-orange-light transition disabled:opacity-60 text-lg"
          >
            {loading ? "Calcolo in corso..." : "Ottieni il tuo punteggio"}
          </button>
        </form>
      </div>
    </div>
  );
}
