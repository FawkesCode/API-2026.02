import { servicoProjeto } from "@/lib/services/projeto.service";
import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
  TicketView,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export type TicketRes = Awaited<
  ReturnType<typeof servicoProjeto.listarTicketsPorProjeto>
>[number];

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
    priority: info.status
      ? TicketPriorityLabel[info.prioridade]
      : "Não definido",
    description: info.descricao,
    recentLogs: [],
  };
}
