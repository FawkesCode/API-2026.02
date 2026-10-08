import { Prioridade } from "@/lib/generated/prisma/client";

const ORDEM_PRIORIDADE: Record<Prioridade, number> = {
  [Prioridade.CRITICA]: 0,
  [Prioridade.ALTA]: 1,
  [Prioridade.MEDIA]: 2,
  [Prioridade.BAIXA]: 3,
};

/** Prioridade descendente; em caso de empate, tickets mais novos primeiro. */
export function ordenarTicketsPorPrioridade<
  T extends { prioridade: Prioridade; criadoEm: Date },
>(tickets: T[]): T[] {
  return [...tickets].sort((a, b) => {
    const diferencaPrioridade =
      ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];

    return diferencaPrioridade || b.criadoEm.getTime() - a.criadoEm.getTime();
  });
}
