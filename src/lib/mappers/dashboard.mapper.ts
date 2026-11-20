import { StatusTicket } from "@/types/ticket-enums";
import type {
  AgregacaoAbertosPorEquipeDashboard,
  AgregacaoStatusDashboard,
  AgregacaoUrgenciaDashboard,
} from "@/types/dashboard";

// As chaves precisam bater com as do chartConfig de tickets-per-status.tsx
const CHAVE_GRAFICO_STATUS: Record<StatusTicket, string> = {
  [StatusTicket.NAO_INICIADO]: "notStarted",
  [StatusTicket.EM_ANDAMENTO]: "inProgress",
  [StatusTicket.SOLICITACAO_ENCERRAMENTO]: "closureRequested",
  [StatusTicket.EM_REVISAO]: "inReview",
  [StatusTicket.ENCERRADO]: "closed",
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