import { servicoProjeto } from "@/lib/services/projeto.service";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

enum TicketType {
  Maintenance = "MANUTENCAO",
  Installation = "INSTALACAO",
}

enum TicketPriority {
  Low = "BAIXA",
  Medium = "MEDIA",
  High = "ALTA",
  Critic = "CRITICA",
}

enum TicketStatus {
  Open = "ABERTO",
  InProgress = "EM_ANDAMENTO",
  Finished = "ENCERRADO",
}

const TicketTypeLabel: Record<TicketType, string> = {
  [TicketType.Maintenance]: "Manutenção",
  [TicketType.Installation]: "Instalação",
};

const TicketPriorityLabel: Record<TicketPriority, string> = {
  [TicketPriority.Low]: "Baixa",
  [TicketPriority.Medium]: "Média",
  [TicketPriority.High]: "Alta",
  [TicketPriority.Critic]: "Crítica",
};

const TicketStatusLabel: Record<TicketStatus, string> = {
  [TicketStatus.Open]: "Não iniciado",
  [TicketStatus.InProgress]: "Em Andamento",
  [TicketStatus.Finished]: "Encerrado",
};

export interface TicketView {
  id: string;
  title: string;
  type: string;
  openedAt: string;
  timeRemaining: string;
  createdBy: string;
  teams: Array<string | undefined>;
  status: string;
  priority: string;
  description: string;
  recentLogs: TeamLogView[] | null;
}

export interface TeamLogView {
  title: string;
  sentBy: string;
  sentAt: string;
}

type TicketRes = NonNullable<
  Awaited<
    ReturnType<typeof servicoProjeto.buscarProjetoComTicketDeInstalacao>
  >["ticketInstalacao"]
>;

export function formatTicket(
  info: TicketRes,
  team: string,
  creator: string,
): TicketView | null {
  if (!info) return null;

  return {
    id: info.id,
    title: info.titulo.split("Instalação")[1].split("—")[1],
    type: TicketTypeLabel[info.categoria],
    openedAt: info.criadoEm
      ? format(new Date(info.criadoEm), "d/M")
      : "Criado em -",
    timeRemaining: info.slaEm
      ? formatDistanceToNow(new Date(info.slaEm), {
          addSuffix: true,
          locale: ptBR,
        })
      : "Sem prazo definido",
    createdBy: creator,
    teams: [team],
    status: TicketStatusLabel[info.status],
    priority: TicketPriorityLabel[info.prioridade],
    description: info.descricao,
    recentLogs: [],
  };
}
