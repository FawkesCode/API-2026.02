import type { Prisma } from "@/lib/generated/prisma/client";
import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
  TicketView,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Ticket "puro" (sem include) — usado na tela de um projeto específico,
// onde o projectId já vem da rota.
type TicketSemProjeto = Prisma.TicketGetPayload<Record<string, never>>;

// Ticket com o projeto incluído — usado na listagem geral (aba
// Tickets), onde cada card precisa saber a qual projeto pertence.
type TicketComProjeto = Prisma.TicketGetPayload<{
  include: { projeto: { select: { id: true } } };
}>;

export type TicketRes = TicketSemProjeto | TicketComProjeto;

function extrairProjectId(info: TicketRes): string | undefined {
  return "projeto" in info ? info.projeto?.id : undefined;
}

export function toTicketDTO(info: TicketRes): TicketView {
  return {
    id: info.id,
    title: info.titulo,
    type: info.categoria ? TicketTypeLabel[info.categoria] : "Não definido",
    openedAt: info.criadoEm
      ? format(new Date(info.criadoEm), "d/M")
      : "Criado em -",
    timeRemaining: info.slaEm
      ? formatDistanceToNow(new Date(info.slaEm), {
          addSuffix: false,
          locale: ptBR,
        })
      : "Sem prazo definido",
    createdBy: "Esperando correção",
    teams: ["Esperando correção"],
    status: info.status ? TicketStatusLabel[info.status] : "Não definido",
    priority: info.prioridade
      ? TicketPriorityLabel[info.prioridade]
      : "Não definido",
    description: info.descricao,
    recentLogs: [],
    projectId: extrairProjectId(info),
  };
}