import type { FiltrosDashboard } from "@/types/dashboard";

export const INDICADORES_TICKETS = {
  total: "Total de tickets",
  encerramento: "Encerramento solicitado",
  foraDoSla: "Fora do SLA",
  proximoDoSla: "Próximo do SLA",
} as const;

export type IndicadorTickets = keyof typeof INDICADORES_TICKETS;

export function parseIndicadorTickets(valor: unknown): IndicadorTickets | undefined {
  return typeof valor === "string" && Object.hasOwn(INDICADORES_TICKETS, valor)
    ? (valor as IndicadorTickets)
    : undefined;
}

const CHAVES_FILTROS = [
  "data", "dataInicio", "dataFim", "equipeId", "projetoId", "clienteId", "usuarioId",
] as const satisfies ReadonlyArray<keyof FiltrosDashboard>;

export function hrefTicketsDashboard(filtros: FiltrosDashboard, indicador: IndicadorTickets) {
  const params = new URLSearchParams({ indicador });
  for (const chave of CHAVES_FILTROS) {
    const valor = filtros[chave];
    if (valor) params.set(chave, valor);
  }
  return `/tickets?${params}`;
}
