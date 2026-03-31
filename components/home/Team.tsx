"use client";

import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CertCarousel from "@/components/home/CertCarousel";

const team = [
  {
    name: "Alex",
    photo: "/images/Foto-Performance-Flows_Alex-min.png",
    bio: [
      "5 anni in agenzie di digital marketing",
      "Founder di Performance Flows",
      "Creatore di PPC Starter Kit",
      "Specializzato in Google Ads orientato al profitto e-commerce",
    ],
  },
  {
    name: "Andrea",
    photo: "/images/Foto-Performance-Flows_Andrea-min.png",
    bio: [
      "Ex Co-founder Tractionboard.co (Techstars '23)",
      "Creator di Founders Espresso — Storie di Founders",
      "Specializzato in Performance Marketing (focus su e-commerce)",
    ],
  },
];


export default function Team() {
  return (
    <section id="team" className="bg-brand-blue text-white py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Il Team</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              In Performance Flows prendiamo Google Ads{" "}
              <strong className="text-white">sul serio</strong> — con costante
              aggiornamento sulle tecnologie e implementazioni più moderne e
              conseguimento di tutte le certificazioni ufficiali.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {team.map((member, i) => (
            <ScrollReveal key={member.name} delay={i * 0.15}>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
                <div className="w-28 h-28 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-brand-orange/30">
                  <Image
                    src={member.photo}
                    alt={`Foto ${member.name}`}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-4">{member.name}</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  {member.bio.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="text-center mb-8">
            <p className="text-sm text-blue-300 mb-6 font-semibold uppercase tracking-wide">
              Le nostre certificazioni
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel — full bleed, fuori dal max-w */}
        <div className="mb-10 -mx-4">
          <CertCarousel />
        </div>

      </div>
    </section>
  );
}
