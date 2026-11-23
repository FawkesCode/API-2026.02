import { servicoDashboard } from "@/services/dashboard.service";
import type {
  AgregacaoAbertosPorEquipeDashboard,
  AgregacaoSlaDashboard,
  AgregacaoSlaEstimadoVsRealDashboard,
  AgregacaoStatusDashboard,
  AgregacaoUrgenciaDashboard,
  AgregacoesVolumeStatusUrgenciaDashboard,
  FiltrosDashboard,
  ResumoSlaDashboard,
} from "@/types/dashboard";

export type { FiltrosDashboard };

export async function getAgregacoesDashboard(
  filtros?: FiltrosDashboard,
): Promise<AgregacoesVolumeStatusUrgenciaDashboard> {
  try {
    return await servicoDashboard.obterAgregacoesVolumeStatusUrgencia(filtros);
  } catch (erro) {
    console.error(
      "[getAgregacoesDashboard] Erro ao calcular agregações do dashboard:",
      erro,
    );
    throw new Error("Não foi possível carregar os indicadores do dashboard.");
  }
}

export async function getChamadosCriados(
  filtros?: FiltrosDashboard,
): Promise<number> {
  try {
    return await servicoDashboard.contarChamadosCriados(filtros);
  } catch (erro) {
    console.error(
      "[getChamadosCriados] Erro ao contar chamados criados:",
      erro,
    );
    throw new Error("Não foi possível contar os chamados criados.");
  }
}

export async function getChamadosFechados(
  filtros?: FiltrosDashboard,
): Promise<number> {
  try {
    return await servicoDashboard.contarChamadosFechados(filtros);
  } catch (erro) {
    console.error(
      "[getChamadosFechados] Erro ao contar chamados fechados:",
      erro,
    );
    throw new Error("Não foi possível contar os chamados fechados.");
  }
}

export async function getTicketsPorStatus(
  filtros?: FiltrosDashboard,
): Promise<AgregacaoStatusDashboard> {
  try {
    return await servicoDashboard.agruparPorStatus(filtros);
  } catch (erro) {
    console.error(
      "[getTicketsPorStatus] Erro ao agrupar chamados por status:",
      erro,
    );
    throw new Error("Não foi possível carregar os chamados por status.");
  }
}

export async function getTicketsAbertosPorEquipe(
  filtros?: FiltrosDashboard,
): Promise<AgregacaoAbertosPorEquipeDashboard> {
  try {
    return await servicoDashboard.agruparAbertosPorEquipe(filtros);
  } catch (erro) {
    console.error(
      "[getTicketsAbertosPorEquipe] Erro ao agrupar chamados abertos por equipe:",
      erro,
    );
    throw new Error(
      "Não foi possível carregar os chamados abertos por equipe.",
    );
  }
}

export async function getTicketsPorUrgencia(
  filtros?: FiltrosDashboard,
): Promise<AgregacaoUrgenciaDashboard> {
  try {
    return await servicoDashboard.agruparPorUrgencia(filtros);
  } catch (erro) {
    console.error(
      "[getTicketsPorUrgencia] Erro ao agrupar chamados por urgência:",
      erro,
    );
    throw new Error("Não foi possível carregar os chamados por urgência.");
  }
}

export async function getTicketsPorSla(
  filtros?: FiltrosDashboard,
): Promise<AgregacaoSlaDashboard> {
  try {
    return await servicoDashboard.agruparPorSla(filtros);
  } catch (erro) {
    console.error(
      "[getTicketsPorSla] Erro ao agrupar chamados por SLA:",
      erro,
    );
    throw new Error("Não foi possível carregar os chamados por SLA.");
  }
}

export async function getResumoSla(
  filtros?: FiltrosDashboard,
): Promise<ResumoSlaDashboard> {
  try {
    return await servicoDashboard.contarResumoSla(filtros);
  } catch (erro) {
    console.error("[getResumoSla] Erro ao calcular resumo de SLA:", erro);
    throw new Error("Não foi possível carregar o resumo de SLA.");
  }
}

export async function getSlaEstimadoVsReal(
  filtros?: FiltrosDashboard,
): Promise<AgregacaoSlaEstimadoVsRealDashboard> {
  try {
    return await servicoDashboard.agruparSlaEstimadoVsReal(filtros);
  } catch (erro) {
    console.error(
      "[getSlaEstimadoVsReal] Erro ao agrupar SLA estimado vs tempo real:",
      erro,
    );
    throw new Error(
      "Não foi possível carregar o comparativo de SLA estimado vs tempo real.",
    );
  }
}
