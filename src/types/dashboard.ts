import { Prioridade, StatusTicket } from "@/types/ticket-enums";

export interface FiltrosDashboard {
  equipeId?: string;
  usuarioId?: string;
  projetoId?: string;
  clienteId?: string;
  data?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const ORDEM_STATUS_DASHBOARD: readonly StatusTicket[] = [
  StatusTicket.NAO_INICIADO,
  StatusTicket.EM_ANDAMENTO,
  StatusTicket.SOLICITACAO_ENCERRAMENTO,
  StatusTicket.EM_REVISAO,
  StatusTicket.ENCERRADO,
] as const;

export const ROTULO_STATUS_DASHBOARD: Record<StatusTicket, string> = {
  [StatusTicket.NAO_INICIADO]: "Não iniciado",
  [StatusTicket.EM_ANDAMENTO]: "Em andamento",
  [StatusTicket.SOLICITACAO_ENCERRAMENTO]: "Encerramento solicitado",
  [StatusTicket.EM_REVISAO]: "Em revisão",
  [StatusTicket.ENCERRADO]: "Encerrado",
};

export const ORDEM_URGENCIA_DASHBOARD: readonly Prioridade[] = [
  Prioridade.CRITICA,
  Prioridade.ALTA,
  Prioridade.MEDIA,
  Prioridade.BAIXA,
] as const;

export const ROTULO_URGENCIA_DASHBOARD: Record<Prioridade, string> = {
  [Prioridade.CRITICA]: "Crítica",
  [Prioridade.ALTA]: "Alta",
  [Prioridade.MEDIA]: "Média",
  [Prioridade.BAIXA]: "Baixa",
};

export const FAIXA_SLA_DASHBOARD = {
  SLA_4H: "4h",
  SLA_8H: "8h",
  SLA_1D: "1d",
  SLA_2D: "2d",
  SLA_3D: "3d",
  SLA_7D: "7d",
} as const;
export type FaixaSlaDashboard =
  (typeof FAIXA_SLA_DASHBOARD)[keyof typeof FAIXA_SLA_DASHBOARD];

export const ORDEM_SLA_DASHBOARD: readonly FaixaSlaDashboard[] = [
  FAIXA_SLA_DASHBOARD.SLA_4H,
  FAIXA_SLA_DASHBOARD.SLA_8H,
  FAIXA_SLA_DASHBOARD.SLA_1D,
  FAIXA_SLA_DASHBOARD.SLA_2D,
  FAIXA_SLA_DASHBOARD.SLA_3D,
  FAIXA_SLA_DASHBOARD.SLA_7D,
] as const;

export const ROTULO_SLA_DASHBOARD: Record<FaixaSlaDashboard, string> = {
  [FAIXA_SLA_DASHBOARD.SLA_4H]: "4 horas",
  [FAIXA_SLA_DASHBOARD.SLA_8H]: "8 horas",
  [FAIXA_SLA_DASHBOARD.SLA_1D]: "1 dia",
  [FAIXA_SLA_DASHBOARD.SLA_2D]: "2 dias",
  [FAIXA_SLA_DASHBOARD.SLA_3D]: "3 dias",
  [FAIXA_SLA_DASHBOARD.SLA_7D]: "7 dias",
};

export interface ResumoVolumeDashboard {
  criados: number;
  fechados: number;
  abertos: number;
  encerramentoSolicitado: number;
}

export interface ItemAgregacaoStatus {
  status: StatusTicket;
  label: string;
  quantidade: number;
}

export interface AgregacaoStatusDashboard {
  total: number;
  abertos: number;
  encerramentoSolicitado: number;
  itens: ItemAgregacaoStatus[];
}

export interface ItemAbertosPorEquipe {
  equipeId: string;
  nome: string;
  quantidade: number;
}

export interface AgregacaoAbertosPorEquipeDashboard {
  totalAbertos: number;
  equipes: ItemAbertosPorEquipe[];
}

export interface ItemAgregacaoUrgencia {
  prioridade: Prioridade;
  label: string;
  quantidade: number;
}

export interface AgregacaoUrgenciaDashboard {
  total: number;
  itens: ItemAgregacaoUrgencia[];
}

export interface ItemAgregacaoSla {
  sla: FaixaSlaDashboard;
  label: string;
  quantidade: number;
}

export interface AgregacaoSlaDashboard {
  total: number;
  itens: ItemAgregacaoSla[];
}

export interface ResumoSlaDashboard {
  foraDoSla: number;
  proximoDoSla: number;
}

export interface ItemSlaEstimadoVsReal {
  sla: FaixaSlaDashboard;
  label: string;
  estimado: number;
  real: number;
}

export interface AgregacaoSlaEstimadoVsRealDashboard {
  totalEstimado: number;
  totalReal: number;
  itens: ItemSlaEstimadoVsReal[];
}

export interface AgregacoesVolumeStatusUrgenciaDashboard {
  volume: ResumoVolumeDashboard;
  porStatus: AgregacaoStatusDashboard;
  abertosPorEquipe: AgregacaoAbertosPorEquipeDashboard;
  porUrgencia: AgregacaoUrgenciaDashboard;
  porSla: AgregacaoSlaDashboard;
  resumoSla: ResumoSlaDashboard;
  slaEstimadoVsReal: AgregacaoSlaEstimadoVsRealDashboard;
}
