"use client";

import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
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
    <section id="team" className="bg-brand-blue text-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Il Team</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              In Performance Flows prendiamo la performance{" "}
              <strong className="text-white">sul serio</strong>, con costante
              aggiornamento sulle tecnologie e implementazioni più moderne e
              conseguimento di tutte le certificazioni ufficiali.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 max-w-4xl mx-auto">
          {team.map((member, i) => (
            <ScrollReveal key={member.name} delay={i * 0.1}>
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center h-full flex flex-col items-center">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full mb-4 overflow-hidden ring-4 ring-brand-orange/30">
                  <Image
                    src={member.photo}
                    alt={`Foto ${member.name}`}
                    width={144}
                    height={144}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg md:text-xl font-bold leading-tight">{member.name}</h3>
                <p className="text-xs md:text-sm text-blue-200/70 mt-1.5 leading-snug">{member.role}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.25}>
          <p className="text-center text-sm text-blue-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Oltre a Google Ads e feed, lavoriamo su migrazione Shopify, Klaviyo, CRO e profit tracking, sempre integrati nel metodo ProfitFlow™ e mai come servizi separati.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="text-center mb-8">
            <p className="text-sm text-blue-300 mb-6 font-semibold uppercase tracking-wide">
              Le nostre certificazioni
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel: full bleed, fuori dal max-w */}
        <div className="mb-10 -mx-4">
          <CertCarousel />
        </div>

      </div>
    </section>
  );
}
