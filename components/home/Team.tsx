"use client";

import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import SectionHeading from "@/components/ui/SectionHeading";
import CertCarousel from "@/components/home/CertCarousel";

const team = [
  { name: "Alex", role: "Founder", photo: "/images/team/alex-600.jpg" },
  { name: "Andrea", role: "Performance Marketing Specialist", photo: "/images/team/andrea-600.jpg" },
  { name: "Daniele", role: "Performance Marketing Specialist", photo: "/images/team/daniele-600.jpg" },
  { name: "Giulio", role: "Performance Marketing Specialist", photo: "/images/team/giulio-600.jpg" },
  { name: "Leonardo", role: "Performance Marketing Specialist", photo: "/images/team/leonardo-600.jpg" },
  { name: "Matias", role: "Performance Marketing Specialist", photo: "/images/team/matias-600.jpg" },
];


export default function Team() {
  return (
    <section id="team" className="grain relative bg-[#0b1152] text-white py-24 md:py-36">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(90% 70% at 10% 0%, rgba(26,37,128,0.75) 0%, transparent 60%), linear-gradient(180deg, #0a0f42 0%, #0b1152 100%)",
        }}
      />

      <div className="relative z-10 max-w-[88rem] mx-auto px-6 md:px-10">
        <SectionHeading
          eyebrow="Chi siamo"
          title="Il Team"
          tone="dark"
          align="center"
          lead={
            <>
              In Performance Flows prendiamo la performance{" "}
              <strong className="text-white font-medium">sul serio</strong>, con costante
              aggiornamento sulle tecnologie e implementazioni più moderne e
              conseguimento di tutte le certificazioni ufficiali.
            </>
          }
          className="mb-16 md:mb-20 max-w-3xl mx-auto"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-10 md:gap-x-6">
          {team.map((member, i) => (
            <ScrollReveal key={member.name} delay={(i % 6) * 0.07}>
              <figure className="group">
                <div className="relative overflow-hidden rounded-sm aspect-[4/5] bg-white/5">
                  <Image
                    src={member.photo}
                    alt={`Foto ${member.name}`}
                    width={400}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="mt-4 border-t border-[color:var(--rule-invert)] pt-3 transition-colors duration-500 group-hover:border-brand-orange/60">
                  <p className="text-[15px] font-semibold leading-tight">{member.name}</p>
                  <p className="text-[11px] text-white/45 mt-1.5 leading-snug tracking-[0.02em]">{member.role}</p>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <p className="mt-16 text-center text-[15px] text-white/55 max-w-3xl mx-auto leading-relaxed">
            Oltre a Google Ads e feed, lavoriamo su migrazione Shopify, Klaviyo, CRO e profit tracking, sempre integrati nel metodo ProfitFlow™ e mai come servizi separati.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div className="mt-16 md:mt-20 flex items-center gap-5">
            <p className="eyebrow text-white/40 whitespace-nowrap">Le nostre certificazioni</p>
            <span className="h-px flex-1 bg-[color:var(--rule-invert)]" aria-hidden="true" />
          </div>
        </ScrollReveal>
      </div>

      {/* Carousel: full bleed, fuori dal max-w */}
      <div className="relative z-10 mt-10">
        <CertCarousel />
      </div>
    </section>
  );
}
