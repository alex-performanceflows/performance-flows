"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

/** Pagine con hero scuro a tutto schermo: lì l'header può restare trasparente. */
const DARK_HERO_ROUTES = ["/", "/indice-di-scalabilita-shopify"];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Sulle pagine con sfondo chiaro (privacy, cookie policy...) l'header deve
  // essere sempre pieno, altrimenti logo e link bianchi spariscono.
  const hasDarkHero = DARK_HERO_ROUTES.includes(pathname);
  const solid = scrolled || !hasDarkHero;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid
          ? "bg-white/98 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src={solid ? "/images/logo-color.webp" : "/images/logo-white.webp"}
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
              href={`/#${item.toLowerCase()}`}
              className={`transition-colors duration-300 ${
                solid
                  ? "text-brand-text/70 hover:text-brand-blue"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
          <a
            href="/#contatto"
            className={`px-5 py-2.5 rounded-lg transition-all duration-300 font-semibold ${
              solid
                ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
                : "bg-white text-brand-blue hover:bg-white/90"
            }`}
          >
            Raccontaci del tuo progetto
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 transition-colors duration-300 ${
            solid ? "text-gray-700" : "text-white"
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
              href={`/#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brand-blue transition"
            >
              {item}
            </a>
          ))}
          <a
            href="/#contatto"
            onClick={() => setMenuOpen(false)}
            className="bg-brand-blue text-white px-5 py-2.5 rounded-lg text-center font-semibold"
          >
            Raccontaci del tuo progetto
          </a>
        </nav>
      )}
    </header>
  );
}
