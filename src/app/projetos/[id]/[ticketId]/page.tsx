import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import { TicketLogs } from "@/components/tickets/ticket-logs";

import {
  getProjectById,
  getProjectTickets,
  getTicket,
} from "@/lib/data/project-ticket";
import { getLogAuthor, getTicketLogs } from "@/lib/data/ticket-logs";
import { TicketView } from "@/types/ticket";
import { notFound } from "next/navigation";

type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

// TODO: Validação da url a partir dos ids disponíveis no banco
export default async function TicketLogsPage({
  params,
}: PageProps<"/projetos/[id]/[ticketId]">) {
  const { id, ticketId } = await params;
  const { title } = await getProjectById(id);
  const ticket: TicketView = await getTicket(ticketId);

  // TODO: autor vem da sessão do usuário logado quando existir autenticação
  const [autor, logs] = await Promise.all([
    getLogAuthor(ticketId),
    getTicketLogs(ticketId),
  ]);

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

      <section className="shrink-0 rounded-t-xl border -mt-6 border-gray-200 bg-white p-6">
        {ticket ? (
          <>
            <div className="flex justify-between">
              <h2 className="text-lg font-bold text-card-foreground">
                {ticket.title} {ticket.type !== "" && "|"} {ticket.type}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground underline">
                  {ticket.status}
                </span>
                <PriorityBadge priority={TicketPriorityMap[ticket.priority]}>
                  {ticket.priority}
                </PriorityBadge>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3">
              <p className="pt-1 text-xs text-muted-foreground">
                Criado em {ticket.openedAt} • Tempo restante:{" "}
                {ticket.timeRemaining.split("em")} • Aberto por{" "}
                <span className="italic">{ticket.createdBy}</span>
              </p>
              <div className="flex gap-2">
                {ticket.teams.map((team) => (
                  <Badge
                    key={team}
                    className="border-muted-foreground bg-transparent text-xs text-muted-foreground"
                  >
                    {team}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <TicketLogs ticketId={ticketId} logsIniciais={logs} autor={autor} />
    </div>
  );
}
