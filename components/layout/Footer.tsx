import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="grain relative bg-[#0a0f42] text-white">
      <div className="relative z-10 max-w-[88rem] mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid gap-12 md:gap-16 md:grid-cols-[1.2fr_1fr] border-b border-[color:var(--rule-invert)] pb-12 md:pb-16">
          <div>
            <Image
              src="/images/logo-white.webp"
              alt="Performance Flows"
              width={194}
              height={80}
              className="h-11 w-auto mb-8 opacity-90"
            />
            <p className="font-display display-3 font-normal text-white/85 max-w-xl leading-snug tracking-[-0.01em]">
              Performance marketing a 360° per store Shopify.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-10 content-start">
            <div>
              <p className="eyebrow text-white/35 mb-5">Sede</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Performance Flows S.R.L.
                <br />
                Via Dotti, 29, 31100 Treviso (TV), Italia
                <br />
                P.IVA: 05527760267
              </p>
            </div>

            <div>
              <p className="eyebrow text-white/35 mb-5">Legale</p>
              <div className="flex flex-col gap-3 text-sm text-white/70">
                <Link href="/privacy-policy" className="link-sweep self-start hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/cookie-policy" className="link-sweep self-start hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Performance Flows S.R.L. – Tutti i diritti riservati.</p>
          <p className="index-num tracking-[0.12em] uppercase">Treviso, Italia</p>
        </div>
      </div>
    </footer>
  );
}
