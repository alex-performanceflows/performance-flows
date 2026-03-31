import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brand-blue text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <Image
              src="/images/logo-white.webp"
              alt="Performance Flows"
              width={194}
              height={80}
              className="h-12 w-auto mb-3 opacity-80"
            />
            <p className="text-sm text-blue-200">
              Performance Flows S.R.L.
              <br />
              Via Dotti, 29, 31100 Treviso (TV), Italia
              <br />
              P.IVA: 05527760267
            </p>
          </div>

          <div className="flex gap-6 text-sm text-blue-200">
            <a
              href="https://www.iubenda.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.iubenda.com/privacy-policy/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Cookie Policy
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-blue-700 text-center text-sm text-blue-300">
          © {new Date().getFullYear()} Performance Flows S.R.L. — Tutti i
          diritti riservati.
        </div>
      </div>
    </footer>
  );
}
