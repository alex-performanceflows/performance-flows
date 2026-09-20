"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

/** Pagine con hero scuro a tutto schermo: lì l'header può restare trasparente. */
const DARK_HERO_ROUTES = ["/", "/indice-di-scalabilita-shopify"];

const NAV = ["Problemi", "Metodo", "Team", "FAQ"] as const;

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  // Sulle pagine con sfondo chiaro (privacy, cookie policy...) l'header deve
  // essere sempre pieno, altrimenti logo e link bianchi spariscono.
  const hasDarkHero = DARK_HERO_ROUTES.includes(pathname);
  const solid = scrolled || !hasDarkHero;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
      // Filo di avanzamento sotto l'header: dice quanto manca alla fine
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-500 ${
        solid
          ? "bg-white/85 backdrop-blur-xl shadow-[0_1px_0_0_var(--rule)]"
          : "bg-transparent"
      }`}
    >
      <div
        className={`max-w-[88rem] mx-auto px-6 md:px-10 flex items-center justify-between transition-[padding] duration-500 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <Link href="/" className="flex items-center" aria-label="Performance Flows, home">
          <Image
            src={solid ? "/images/logo-color.webp" : "/images/logo-white.webp"}
            alt="Performance Flows"
            width={194}
            height={80}
            className={`w-auto transition-all duration-500 ${scrolled ? "h-10" : "h-12"}`}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV.map((item) => (
            <a
              key={item}
              href={`/#${item.toLowerCase()}`}
              className={`link-sweep text-[13px] font-medium tracking-[0.02em] transition-colors duration-300 ${
                solid ? "text-brand-text/70 hover:text-brand-ink" : "text-white/75 hover:text-white"
              }`}
            >
              {item}
            </a>
          ))}
          <Link
            href="/#contatto"
            className={`btn-sweep inline-flex items-center rounded-full px-6 py-2.5 text-[13px] font-semibold transition-colors duration-300 ${
              solid ? "bg-brand-ink text-white" : "bg-white text-brand-ink"
            }`}
          >
            <span>Raccontaci del tuo progetto</span>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 transition-colors duration-300 ${solid ? "text-brand-ink" : "text-white"}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 7h16M4 15h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Avanzamento della lettura */}
      <div className="relative h-px w-full" aria-hidden="true">
        <div
          className="absolute left-0 top-0 h-px bg-brand-orange/70 origin-left transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%`, opacity: solid ? 1 : 0.5 }}
        />
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[color:var(--rule)] px-6 py-5 flex flex-col gap-5 text-sm font-medium text-brand-text/75">
          {NAV.map((item) => (
            <a
              key={item}
              href={`/#${item.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="hover:text-brand-ink transition"
            >
              {item}
            </a>
          ))}
          <Link
            href="/#contatto"
            onClick={() => setMenuOpen(false)}
            className="bg-brand-ink text-white px-5 py-3 rounded-full text-center font-semibold"
          >
            Raccontaci del tuo progetto
          </Link>
        </nav>
      )}
    </header>
  );
}
