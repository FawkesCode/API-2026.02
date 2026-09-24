import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import { TicketLogs } from "@/components/tickets/ticket-logs";

import { getProjectById, getTicket } from "@/lib/data/project-ticket";
import { getLogAuthor, getTicketLogs } from "@/lib/data/ticket-logs";
import { TicketView } from "@/types/ticket";
import TicketsLogsView from "@/components/tickets/ticket-logs-view";

type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

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
