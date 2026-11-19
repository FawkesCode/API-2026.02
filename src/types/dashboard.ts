import { Prioridade, StatusTicket } from "@/types/ticket-enums";

/**
 * Filtros comuns às consultas do dashboard.
 * - `equipeId` omitido representa "Todas as equipes".
 * - Para filtro de data: `data` representa um dia específico (`YYYY-MM-DD`);
 *   `dataInicio` e/ou `dataFim` representam um intervalo inclusivo (`YYYY-MM-DD`).
 */
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
  /** Total de chamados criados no recorte filtrado (card "Total de tickets"). */
  criados: number;
  /**
   * Total de chamados encerrados (`status = ENCERRADO`).
   * Quando há filtro de data, considera a data de encerramento (`encerradoEm`).
   */
  fechados: number;
  /** Total de chamados em aberto (`status != ENCERRADO`) no recorte filtrado. */
  abertos: number;
  /** Total de chamados com status `SOLICITACAO_ENCERRAMENTO` (card "Encerramento solicitado"). */
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
  /**
   * Total de tickets distintos em aberto (`status != ENCERRADO`).
   * Um ticket alocado a mais de uma equipe entra em cada barra correspondente,
   * mas é contado apenas uma vez neste total.
   */
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
