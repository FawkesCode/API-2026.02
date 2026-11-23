import { Cargo } from "@/types/ticket-enums";

export const CARGO_ANALISTA_SUPORTE_EXTERNO = Cargo.SUPORTE;
export const CARGO_TECNICO = Cargo.TECNICO;
export const CARGO_GESTOR = Cargo.GESTOR;

export function podeAbrirTicket(cargo: Cargo | undefined | null): boolean {
  return (
    cargo == CARGO_TECNICO ||
    cargo == CARGO_ANALISTA_SUPORTE_EXTERNO ||
    cargo == Cargo.SUPORTE_INTERNO ||
    cargo == CARGO_GESTOR
  );
}

export function podeVerMinhaEquipe(cargo: Cargo | undefined | null): boolean {
  return cargo === CARGO_TECNICO || cargo === CARGO_GESTOR;
}

export function podeVerUsuarios(cargo: Cargo | undefined | null): boolean {
  return cargo === Cargo.SUPORTE_INTERNO;
}

export function podeCriarProjeto(cargo: Cargo | undefined | null): boolean {
  return cargo === Cargo.COMERCIAL;
}

/** Mesmo cargo que a API exige para gerenciar clientes. */
export function podeGerenciarClientes(cargo: Cargo | undefined | null): boolean {
  return cargo === Cargo.COMERCIAL;
}

export function podeEditarEquipe(cargo: Cargo | undefined | null): boolean {
  return cargo === CARGO_GESTOR;
}

/** Mesmos cargos que o back aceita em /api/mensagens-log. */
export function podeCadastrarMensagensLog(cargo: Cargo | undefined | null): boolean {
  return (
    cargo === CARGO_TECNICO ||
    cargo === CARGO_GESTOR ||
    cargo === CARGO_ANALISTA_SUPORTE_EXTERNO
  );
}
