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

export const TicketTypeLabel: Record<TicketType, string> = {
  [TicketType.Maintenance]: "Manutenção",
  [TicketType.Installation]: "Instalação",
};

export const TicketPriorityLabel: Record<TicketPriority, string> = {
  [TicketPriority.Low]: "Baixa",
  [TicketPriority.Medium]: "Média",
  [TicketPriority.High]: "Alta",
  [TicketPriority.Critic]: "Crítica",
};

export const TicketStatusLabel: Record<TicketStatus, string> = {
  [TicketStatus.Open]: "Não iniciado",
  [TicketStatus.InProgress]: "Em Andamento",
  [TicketStatus.Finished]: "Encerrado",
};

export interface TeamLogView {
  title: string;
  sentBy: string;
  sentAt: string;
}

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
  
  projectId?: string;
}