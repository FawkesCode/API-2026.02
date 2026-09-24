import { Cargo } from "@/lib/ticket-enums";

/**
 * ATENÇÃO — decisão assumida:
 * O enum `Cargo` do schema atual (TECNICO | GESTOR | SUPORTE | COMERCIAL)
 * não possui um valor "ANALISTA DE SUPORTE EXTERNO". Até que o enum seja
 * ajustado (ou exista um campo separado para diferenciar suporte
 * interno/externo), este papel é tratado como `Cargo.SUPORTE`.
 * Se isso não for o que a US pretendia, ajuste só esta constante.
 */
export const CARGO_ANALISTA_SUPORTE_EXTERNO = Cargo.SUPORTE;

/** Só o Analista de Suporte Externo pode abrir tickets. */
export function podeAbrirTicket(cargo: Cargo | undefined | null): boolean {
  return cargo === CARGO_ANALISTA_SUPORTE_EXTERNO;
}

/** Analista de Suporte Externo acessa Projetos e Tickets, mas não "Minha Equipe". */
export function podeVerMinhaEquipe(cargo: Cargo | undefined | null): boolean {
  return cargo !== CARGO_ANALISTA_SUPORTE_EXTERNO;
}
