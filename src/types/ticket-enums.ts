export const Categoria = {
  MANUTENCAO: "MANUTENCAO",
  INSTALACAO: "INSTALACAO",
} as const;
export type Categoria = (typeof Categoria)[keyof typeof Categoria];

export const Prioridade = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  CRITICA: "CRITICA",
} as const;
export type Prioridade = (typeof Prioridade)[keyof typeof Prioridade];

export const StatusTicket = {
  NAO_INICIADO: "NAO_INICIADO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  SOLICITACAO_ENCERRAMENTO: "SOLICITACAO_ENCERRAMENTO",
  ENCERRADO: "ENCERRADO",
  EM_REVISAO: "EM_REVISAO",
} as const;
export type StatusTicket = (typeof StatusTicket)[keyof typeof StatusTicket];

export const Cargo = {
  TECNICO: "TECNICO",
  GESTOR: "GESTOR",
  SUPORTE: "SUPORTE",
  SUPORTE_INTERNO: "SUPORTE_INTERNO",
  COMERCIAL: "COMERCIAL",
} as const;
export type Cargo = (typeof Cargo)[keyof typeof Cargo];
