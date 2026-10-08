export const PRIORITY_LABELS = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export type Priority = keyof typeof PRIORITY_LABELS;

export const PRIORITY_LEVELS: Priority[] = ["low", "medium", "high", "critical"];

// Enum `Prioridade` (Prisma) -> nível usado nos componentes visuais.
export const PRIORITY_ENUM_TO_LEVEL: Record<string, Priority> = {
  BAIXA: "low",
  MEDIA: "medium",
  ALTA: "high",
  CRITICA: "critical",
};

// Nível visual -> enum `Prioridade` esperado pela API.
export const PRIORITY_LEVEL_TO_ENUM: Record<Priority, string> = {
  low: "BAIXA",
  medium: "MEDIA",
  high: "ALTA",
  critical: "CRITICA",
};

// Label em português (como vem em `TicketView.priority`) -> nível visual.
export const PRIORITY_LABEL_TO_LEVEL: Record<string, Priority> = {
  Baixa: "low",
  Média: "medium",
  Alta: "high",
  Crítica: "critical",
};
