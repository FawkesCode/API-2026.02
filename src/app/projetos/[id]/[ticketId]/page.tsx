import Link from "next/link";
import PageHeader from "@/components/page-header";

import { getProjectById, getTicket } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import TicketsLogsView from "@/components/tickets/ticket-logs-view";

export default async function TicketLogsPage({
  params,
}: PageProps<"/projetos/[id]/[ticketId]">) {
  const { id, ticketId } = await params;
  const { title } = await getProjectById(id);
  const ticket: TicketView = await getTicket(ticketId);

  return (
    <div className="flex h-full min-h-0 flex-col pb-6">
      <div className="shrink-0">
        <PageHeader>
          <Link href={`/projetos/${id}`} className="hover:underline">
            Projeto {title}
          </Link>
          {` > Ticket ${!ticket ? "Sem título" : ticket.title + " : " + ticket.type}`}
        </PageHeader>
      </div>

      <TicketsLogsView id={ticketId} />
    </div>
  );
}
