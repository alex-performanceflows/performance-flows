import Link from "next/link";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="max-w-3xl mx-auto px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-brand-text-light hover:text-brand-blue transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Torna alla home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-brand-blue mb-3">{title}</h1>
        <p className="text-sm text-brand-text-light mb-12">
          Ultimo aggiornamento: {updated}
        </p>

        <div className="legal-body">{children}</div>
      </div>
    </section>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-bold text-brand-blue mt-12 mb-4 first:mt-0">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-brand-text mt-7 mb-2">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-brand-text-light leading-relaxed mb-4">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc pl-5 space-y-2 text-brand-text-light leading-relaxed mb-4 marker:text-brand-orange">
      {children}
    </ul>
  );
}

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto mb-6 rounded-xl border border-black/[0.08]">
      <table className="w-full text-sm min-w-[36rem]">
        <thead className="bg-brand-gray">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-left font-semibold text-brand-text px-4 py-3 border-b border-black/[0.08]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-black/[0.05] last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-3 text-brand-text-light align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
