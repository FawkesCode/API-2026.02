import Link from "next/link";
import PageHeader from "@/components/page-header";
import { PriorityBadge } from "@/components/priority-badge";
import { Badge } from "@/components/ui/badge";
import {
  TicketLogs,
  type Autor,
  type LogItem,
} from "@/components/tickets/ticket-logs";

// Mock temporário | TODO: buscar o ticket e seu histórico quando existir GET /api/tickets/[id]
const ticket = {
  title: "Título do Ticket",
  type: "Tipo",
  openedAt: "12/09",
  createdBy: "Usuário",
  teams: ["TI", "Suporte"],
  status: "Em Andamento",
  priority: "critical" as const,
  description:
    "Descrição do Problema, Descrição do Problema, Descrição do Problema Descrição",
};

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

// TODO: Validação da url a partir dos ids disponíveis no banco
export default async function TicketLogsPage({
  params,
}: PageProps<"/projetos/[id]/[ticketId]">) {
  const { id, ticketId } = await params;

  return (
    <div className="flex h-full min-h-0 flex-col pb-6">
      <div className="shrink-0">
        <PageHeader>
          <Link href={`/projetos/${id}`} className="hover:underline">
            Projeto COD {id}
          </Link>
          {` > Ticket #${ticketId}`}
        </PageHeader>
      </div>

      <section className="shrink-0 rounded-t-md border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-card-foreground">
          {ticket.title} | {ticket.type}
        </h2>
        <p className="pt-1 text-xs text-muted-foreground">
          Aberto em {ticket.openedAt} • #{ticketId} • Aberto por{" "}
          <span className="italic">{ticket.createdBy}</span>
        </p>

        <div className="flex items-center justify-between pt-3">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground underline">
              {ticket.status}
            </span>
            <PriorityBadge priority={ticket.priority}>Crítico</PriorityBadge>
          </div>
        </div>

        <p className="pt-4 text-sm text-muted-foreground">
          {ticket.description}
        </p>
      </section>

      <TicketLogs logsIniciais={logsIniciais} autor={autor} />
    </div>
  );
}
