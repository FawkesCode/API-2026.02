import { servicoProjeto } from "@/lib/services/projeto.service";
import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
  TicketView,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { servicoTicket } from "../services/ticket.service";

export type TicketRes = NonNullable<
  Awaited<ReturnType<typeof servicoTicket.buscarDetalhePorId>>
>;

export type ProjTicketRes = NonNullable<
  Awaited<
    ReturnType<typeof servicoProjeto.buscarProjetoComTicketDeInstalacao>
  >["ticketInstalacao"]
>;

type TicketFromProject = {
  info: ProjTicketRes;
  project?: true;
};

type AloneTicket = {
  info: TicketRes;
  project?: false;
};

type TicketProps = AloneTicket | TicketFromProject;

export function toTicketDTO(info: ProjTicketRes): TicketView {
  return {
    id: info.id,
    title: info.titulo.split("Instalação")[1].split("—")[1],
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
