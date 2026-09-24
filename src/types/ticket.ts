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
  NotStarted = "NAO_INICIADO",
  InProgress = "EM_ANDAMENTO",
  ClosureRequested = "SOLICITACAO_ENCERRAMENTO",
  Finished = "ENCERRADO",
  InReview = "EM_REVISAO",
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
  [TicketStatus.NotStarted]: "Não iniciado",
  [TicketStatus.InProgress]: "Em andamento",
  [TicketStatus.ClosureRequested]: "Solicitação de encerramento",
  [TicketStatus.Finished]: "Encerrado",
  [TicketStatus.InReview]: "Em revisão",
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
  createdById: string;
  teams: Array<string | undefined>;
  status: string;
  priority: string;
  description: string;
  recentLogs: TeamLogView[] | null;
  projectId?: string;
}