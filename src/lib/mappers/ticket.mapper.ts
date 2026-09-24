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
  const teamsArray = [];
  for (const [key, equipes] of Object.entries(info.equipesAlocadas)) {
    teamsArray.push({ id: equipes.equipe.id, nome: equipes.equipe.nome });
  }

  return {
    id: info.id,
    title: info.titulo,
    type:
      TicketTypeLabel[info.categoria] === "Instalação"
        ? ""
        : (TicketTypeLabel[info.categoria] ?? "Não definido"),
    openedAt: format(new Date(info.criadoEm), "d/M"),
    timeRemaining: formatDistanceToNow(new Date(info.slaEm), {
      addSuffix: false,
      locale: ptBR,
    }),
    createdBy: info.abertoPor?.nome ?? "Não definido",
    createdById: info.abertoPorId,
    teams: teamsArray,
    status: TicketStatusLabel[info.status] ?? "Não definido",
    priority: TicketPriorityLabel[info.prioridade] ?? "Não definido",
    description: info.descricao,
    recentLogs: [],
  };
}
