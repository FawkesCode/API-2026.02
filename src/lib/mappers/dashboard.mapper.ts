import { StatusTicket } from "@/types/ticket-enums";
import {
  FAIXA_SLA_DASHBOARD,
  type AgregacaoAbertosPorEquipeDashboard,
  type AgregacaoSlaDashboard,
  type AgregacaoSlaEstimadoVsRealDashboard,
  type AgregacaoStatusDashboard,
  type AgregacaoUrgenciaDashboard,
  type FaixaSlaDashboard,
} from "@/types/dashboard";

const CHAVE_GRAFICO_STATUS: Record<StatusTicket, string> = {
  [StatusTicket.NAO_INICIADO]: "notStarted",
  [StatusTicket.EM_ANDAMENTO]: "inProgress",
  [StatusTicket.SOLICITACAO_ENCERRAMENTO]: "closureRequested",
  [StatusTicket.EM_REVISAO]: "inReview",
  [StatusTicket.ENCERRADO]: "closed",
};

const CHAVE_GRAFICO_SLA: Record<FaixaSlaDashboard, string> = {
  [FAIXA_SLA_DASHBOARD.SLA_4H]: "sla4h",
  [FAIXA_SLA_DASHBOARD.SLA_8H]: "sla8h",
  [FAIXA_SLA_DASHBOARD.SLA_1D]: "sla1d",
  [FAIXA_SLA_DASHBOARD.SLA_2D]: "sla2d",
  [FAIXA_SLA_DASHBOARD.SLA_3D]: "sla3d",
  [FAIXA_SLA_DASHBOARD.SLA_7D]: "sla7d",
};

export function mapStatusParaGrafico(agregacao: AgregacaoStatusDashboard) {
  return agregacao.itens.map((item) => {
    const chave = CHAVE_GRAFICO_STATUS[item.status];
    return {
      status: chave,
      tickets: item.quantidade,
      fill: `var(--color-${chave})`,
    };
  });
}

export function mapEquipesParaGrafico(
  agregacao: AgregacaoAbertosPorEquipeDashboard,
) {
  return agregacao.equipes.map((equipe) => ({
    team: equipe.nome,
    tickets: equipe.quantidade,
  }));
}

export function mapUrgenciaParaGrafico(agregacao: AgregacaoUrgenciaDashboard) {
  return agregacao.itens.map((item) => ({
    priority: item.label,
    tickets: item.quantidade,
  }));
}

export function mapSlaParaGrafico(agregacao: AgregacaoSlaDashboard) {
  return agregacao.itens.map((item) => {
    const chave = CHAVE_GRAFICO_SLA[item.sla];
    return {
      sla: chave,
      tickets: item.quantidade,
      fill: `var(--color-${chave})`,
    };
  });
}

export function mapSlaEstimadoVsRealParaGrafico(
  agregacao: AgregacaoSlaEstimadoVsRealDashboard,
) {
  return agregacao.itens.map((item) => ({
    sla: item.label,
    estimated: item.dentroDoSla,
    real: item.atrasado,
  }));
}
