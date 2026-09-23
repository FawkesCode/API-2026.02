import type { TicketComRelacoes } from "@/lib/services/ticket.service";
import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
  TicketView,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toTicketDTO(info: TicketComRelacoes): TicketView {
  return {
    id: info.id,
    title: info.titulo,
    type: TicketTypeLabel[info.categoria] ?? "Não definido",
    openedAt: format(new Date(info.criadoEm), "d/M"),
    timeRemaining: formatDistanceToNow(new Date(info.slaEm), {
      addSuffix: false,
      locale: ptBR,
    }),
    createdBy: info.abertoPor?.nome ?? "Não definido",
    createdById: info.abertoPorId,
    teams: info.equipesAlocadas.map((alocacao) => alocacao.equipe.nome),
    status: TicketStatusLabel[info.status] ?? "Não definido",
    priority: TicketPriorityLabel[info.prioridade] ?? "Não definido",
    description: info.descricao,
    recentLogs: [],
  };
}