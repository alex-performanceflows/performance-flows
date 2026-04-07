"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/98 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      {/* Announcement banner */}
      <div
        className={`text-center py-1.5 text-sm font-medium transition-all duration-300 ${
          scrolled
            ? "bg-brand-blue text-white"
            : "bg-white/10 backdrop-blur-sm text-white border-b border-white/10"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Call conoscitive nuovamente prenotabili
        </span>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src={scrolled ? "/images/logo-color.webp" : "/images/logo-white.webp"}
            alt="Performance Flows"
            width={194}
            height={80}
            className="h-12 w-auto transition-all duration-300"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {(["Problemi", "Metodo", "Team", "FAQ"] as const).map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`transition-colors duration-300 ${
                scrolled
                  ? "text-brand-text/70 hover:text-brand-blue"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
          <a
            href="#contatto"
            className={`px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
              scrolled
                ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
                : "bg-white text-brand-blue hover:bg-white/90"
            }`}
          >
            Prenota una consulenza
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 transition-colors duration-300 ${
            scrolled ? "text-gray-700" : "text-white"
          }`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
          {(["Problemi", "Metodo", "Team", "FAQ"] as const).map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brand-blue transition"
            >
              {item}
            </a>
          ))}
          <a
            href="#contatto"
            onClick={() => setMenuOpen(false)}
            className="bg-brand-blue text-white px-5 py-2.5 rounded-lg text-center font-semibold"
          >
            Prenota una consulenza
          </a>
        </nav>
      )}
    </header>
  );
}
