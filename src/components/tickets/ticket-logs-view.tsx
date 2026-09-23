import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import {
  TicketLogs,
  type Autor,
  type LogItem,
} from "@/components/tickets/ticket-logs";

import { getTicket } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";

// TODO: vem da sessão do usuário logado quando existir autenticação
const autor: Autor = {
  id: "u-1",
  nome: "Ana Ribeiro",
  equipe: "Infraestrutura",
  setor: "Redes",
};

const logsIniciais: Array<LogItem> = [
  {
    id: "1",
    tipo: "aviso",
    status: "iniciado",
    titulo: "Equipe Infraestrutura começou a trabalhar no ticket",
    descricao: "Ana Ribeiro deu início a atividade",
  },
  {
    id: "2",
    tipo: "manual",
    autorId: "u-2",
    autorNome: "Carlos Menezes",
    equipe: "Elétrica",
    setor: "Campo",
    titulo: "Troca de disjuntor",
    descricao:
      "Descrição do que foi feito. Descrição do que foi feito. Descrição do que foi feito.",
    criadoEm: new Date("2026-09-16T09:00:00"),
  },
  {
    id: "3",
    tipo: "manual",
    autorId: "u-1",
    autorNome: "Ana Ribeiro",
    equipe: "Infraestrutura",
    setor: "Redes",
    titulo: "Recabeamento do rack",
    descricao: "Descrição do que foi feito. Descrição do que foi feito.",
    criadoEm: new Date("2026-09-16T11:30:00"),
  },
];

type PriorityLevel = "critical" | "high" | "medium" | "low";

const TicketPriorityMap: Record<string, PriorityLevel> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};

// TODO: Trazer a lógica de tickets na branch de conexão dos endpoints com o front para ca

export default async function TicketsLogsView({
  id,
  backPageUrl,
}: {
  id: string;
  backPageUrl: string;
}) {
  const ticket: TicketView = await getTicket(id);

  return (
    <div className="flex h-full min-h-0 flex-col pb-6">
      <div className="shrink-0">
        <PageHeader>
          <Link href={`/${backPageUrl}`} className="hover:underline">
            {backPageUrl === "equipe" && "Minha Equipe "}
            {backPageUrl === "tickets" && "Tickets "}
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

      <TicketLogs logsIniciais={logsIniciais} autor={autor} />
    </div>
  );
}
