"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const certifications = [
  { src: "/images/Alex-Duma_Google-Ads-Certification_Search.webp", alt: "Google Ads Search" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Shopping.webp", alt: "Google Ads Shopping" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Display.webp", alt: "Google Ads Display" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Video.webp", alt: "Google Ads Video" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Apps.webp", alt: "Google Ads Apps" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Offline-Sales.webp", alt: "Google Ads Offline Sales" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_AI-Powered-Performance.webp", alt: "Google Ads AI Performance" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Measurement.webp", alt: "Google Ads Measurement" },
  { src: "/images/Alex-Duma_Google-Ads-Certification_Creative.webp", alt: "Google Ads Creative" },
];

// Duplicate for seamless loop
const doubled = [...certifications, ...certifications];

export default function CertCarousel() {
  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex gap-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ width: "max-content" }}
      >
        {doubled.map((cert, i) => (
          <div
            key={i}
            className="flex-shrink-0 bg-white rounded-2xl p-4 shadow-md w-52 h-40 flex items-center justify-center"
          >
            <Image
              src={cert.src}
              alt={cert.alt}
              width={180}
              height={140}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
