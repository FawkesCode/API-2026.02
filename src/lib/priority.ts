export const PRIORITY_LABELS = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export type Priority = keyof typeof PRIORITY_LABELS;
