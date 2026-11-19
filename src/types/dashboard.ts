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

export interface AgregacoesVolumeStatusUrgenciaDashboard {
  volume: ResumoVolumeDashboard;
  porStatus: AgregacaoStatusDashboard;
  abertosPorEquipe: AgregacaoAbertosPorEquipeDashboard;
  porUrgencia: AgregacaoUrgenciaDashboard;
}
