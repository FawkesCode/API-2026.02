import {
  Categoria,
  Prioridade,
  StatusTicket,
} from "@/lib/generated/prisma/enums";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export enum TicketType {
  MAINTENANCE = "MANUTENCAO",
  INSTALLATION = "INSTALACAO",
}

export enum TicketPriority {
  LOW = "BAIXA",
  MEDIUM = "MEDIA",
  HIGH = "ALTA",
  CRITIC = "CRITICA",
}

export enum TicketStatus {
  OPEN = "ABERTO",
  INPROGRESS = "EM_ANDAMENTO",
  FINALIZED = "ENCERRADO",
}

export const TicketTypeLabel: Record<TicketType, string> = {
  [TicketType.MAINTENANCE]: "Manutenção",
  [TicketType.INSTALLATION]: "Instalação",
};

export const TicketPriorityLabel: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: "Baixa",
  [TicketPriority.MEDIUM]: "Média",
  [TicketPriority.HIGH]: "Alta",
  [TicketPriority.CRITIC]: "Crítica",
};

export const TicketStatusLabel: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Não iniciado",
  [TicketStatus.INPROGRESS]: "Em Andamento",
  [TicketStatus.FINALIZED]: "Encerrado",
};

export interface TicketRaw {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  prioridade: Prioridade;
  status: StatusTicket;
  slaEm: Date | string | null;
  criadoEm: Date | string | null;
  atualizadoEm: Date | string | null;
  encerradoEm: Date | string | null;
  projetoId: string;
  abertoPorId: string;
  responsavelId: string | null;
}

export interface TicketView {
  id: string;
  title: string;
  type: string;
  openedAt: string;
  timeRemaining: string;
  createdBy: string;
  teams: string[];
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

export function formatTicket(info: TicketRaw | null): TicketView | null {
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
    createdBy: info.abertoPorId,
    teams: [],
    status: TicketStatusLabel[info.status],
    priority: TicketPriorityLabel[info.prioridade],
    description: info.descricao,
    recentLogs: [],
  };
}
