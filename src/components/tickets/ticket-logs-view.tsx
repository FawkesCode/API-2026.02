import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import { TicketLogs } from "@/components/tickets/ticket-logs";

import { getTicket } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import { getLogAuthor, getTicketLogs } from "@/lib/data/ticket-logs";

// TODO: vem da sessão do usuário logado quando existir autenticação

type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

// TODO: Trazer a lógica de tickets na branch de conexão dos endpoints com o front para ca

export default async function TicketsLogsView({ id }: { id: string }) {
  const ticket: TicketView = await getTicket(id);

  const [autor, logs] = await Promise.all([
    getLogAuthor(id),
    getTicketLogs(id),
  ]);

  return (
    <>
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
                {ticket.teams.length !== 0 ? (
                  ticket.teams.map((team) => (
                    <Badge
                      key={team.id}
                      className="border-muted-foreground bg-transparent text-xs text-muted-foreground"
                    >
                      {team.nome}
                    </Badge>
                  ))
                ) : (
                  <span>Times ainda não atribuídos.</span>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      <TicketLogs ticketId={id} logsIniciais={logs} autor={autor} />
    </>
  );
}
