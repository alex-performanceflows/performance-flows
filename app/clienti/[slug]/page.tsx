import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  queryDatabase,
  queryDatabaseRest,
  fetchPageContent,
  fetchPageDetails,
  fetchLinkRapidi,
  buildPortaleClienteRow,
  buildPortalMeetingRow,
  buildTaskRow,
  buildFatturaRow,
  buildPacchettoRow,
  DB,
} from "@/lib/notion";
import { LoginPortal } from "./_components/LoginPortal";
import { PortalView } from "./_components/PortalView";

export default async function ClientiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch client from Portale Clienti DB
  const clientPages = await queryDatabaseRest(DB.portaleClienti, {
    filter: { property: "Slug URL", rich_text: { equals: slug } },
  });

  if (clientPages.length === 0) notFound();

  const clientData = buildPortaleClienteRow(clientPages[0]);

  // Clean up name: strip "Portale Cliente - " prefix if present
  const clientName = clientData.nome.replace(/^portale cliente\s*[-–]\s*/i, "").trim();

  // Check authentication
  const cookieStore = await cookies();
  const session = cookieStore.get("pf_portal_session");
  let isAuthenticated = false;

  if (session?.value) {
    try {
      const decoded = Buffer.from(session.value, "base64").toString();
      const colonIdx = decoded.indexOf(":");
      const cookieSlug = decoded.slice(0, colonIdx);
      const cookiePassword = decoded.slice(colonIdx + 1);
      isAuthenticated =
        cookieSlug === slug && cookiePassword === clientData.password;
    } catch {
      // invalid cookie
    }
  }

  if (!isAuthenticated) {
    return <LoginPortal slug={slug} clientName={clientName} />;
  }

  const crmId = clientData.crmId;

  // Link Rapidi: tabella interna alla pagina Notion del Portale Cliente
  const linkRapidiPromise = fetchLinkRapidi(clientData.id).catch(() => []);

  // Step 1: task, meetings e contratti del cliente in parallelo
  const [taskPages, meetingPages, contractPages] = await Promise.all([
    crmId
      ? queryDatabase(DB.task, {
          filter: { property: "CRM Clienti", relation: { contains: crmId } },
          sorts: [{ property: "Scadenza", direction: "ascending" }],
        })
      : Promise.resolve([]),
    crmId && DB.portalMeetings
      ? queryDatabaseRest(DB.portalMeetings, {
          filter: { property: "CRM Clienti", relation: { contains: crmId } },
          sorts: [{ property: "Data", direction: "descending" }],
        })
      : Promise.resolve([]),
    crmId
      ? queryDatabase(DB.contratti, {
          filter: { property: "CRM Clienti", relation: { contains: crmId } },
        })
      : Promise.resolve([]),
  ]);

  const contractIds = contractPages.map((p) => p.id);

  // Costruisco tasks e meetings prima (servono per i pacchetti)
  const [tasks, meetings] = await Promise.all([
    Promise.all(taskPages.map(async (p) => ({
      ...buildTaskRow(p),
      content: await fetchPageContent(p.id),
    }))),
    Promise.all(meetingPages.map(async (p) => ({
      ...buildPortalMeetingRow(p),
      content: await fetchPageContent(p.id),
    }))),
  ]);

  // Pacchetti ore + fatture in parallelo
  const contractFilter = contractIds.length === 1
    ? { property: "📄 Contratti", relation: { contains: contractIds[0] } }
    : { or: contractIds.map((id) => ({ property: "📄 Contratti", relation: { contains: id } })) };

  const [pacchettiPages, fatturaPages] = await Promise.all([
    contractIds.length > 0
      ? queryDatabaseRest(DB.pacchetti, {
          filter: contractIds.length === 1
            ? { property: "Contratto", relation: { contains: contractIds[0] } }
            : { or: contractIds.map((id) => ({ property: "Contratto", relation: { contains: id } })) },
        }).catch(() => [])
      : Promise.resolve([]),
    contractIds.length > 0
      ? queryDatabase(DB.fatturazioni, {
          filter: { and: [
            { property: "Emessa?", checkbox: { equals: true } },
            contractFilter,
          ]},
          sorts: [{ property: "Data Emissione", direction: "descending" }],
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const pacchetti = await Promise.all(
    pacchettiPages.map(async (page) => {
      const raw = buildPacchettoRow(page);
      const COMPLETED = ["fatto", "completato", "done", "completata"];
      const taskItems = tasks
        .filter((t) => raw.taskIds.includes(t.id) && COMPLETED.includes(t.stato.toLowerCase()))
        .map((t) => ({ id: t.id, nome: t.nome, tipo: "Task" as const, data: t.scadenza ?? null, durata: t.durata ?? null }));
      const meetingItems = meetings
        .filter((m) => raw.meetingIds.includes(m.id))
        .map((m) => ({ id: m.id, nome: m.titolo, tipo: "Meeting" as const, data: m.data ?? null, durata: m.durata ?? null }));
      const reviewItems = await Promise.all(
        raw.reviewIds.map(async (id) => {
          const details = await fetchPageDetails(id);
          return { id, nome: details.nome, tipo: "Internal Review" as const, data: details.data, durata: details.durata };
        })
      );
      return {
        id: raw.id, nome: raw.nome,
        oreAcquistate: raw.oreAcquistate,
        oreUsate: raw.oreUsate,
        oreRimanenti: raw.oreRimanenti,
        linkedItems: [...taskItems, ...meetingItems, ...reviewItems],
      };
    })
  );

  const fatture = fatturaPages.map(buildFatturaRow);
  const linkRapidi = await linkRapidiPromise;

  // Strip password before passing to client component
  const { password: _pw, slug: _slug, ...safeClient } = clientData;

  return (
    <PortalView
      client={{ ...safeClient, nome: clientName }}
      tasks={tasks}
      meetings={meetings}
      fatture={fatture}
      pacchetti={pacchetti}
      linkRapidi={linkRapidi}
      slug={slug}
    />
  );
}
