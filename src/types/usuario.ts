import type { Cargo } from "@/types/ticket-enums";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}

/**
 * Catálogo de cores/rótulos por tipo de conta (decisão de design do mockup).
 * A chave é o valor do enum `Cargo` do Prisma.
 *
 * ATENÇÃO: o enum atual tem 4 valores (TECNICO, GESTOR, SUPORTE, COMERCIAL),
 * mas o mockup tem 5 tipos. Quando o enum for separado em
 */
export const CARGO_UI: Record<string, { label: string; cor: string }> = {
  COMERCIAL: { label: "Analista de Compras", cor: "#3949F0" },
  SUPORTE: { label: "Suporte Externo", cor: "#1368D0" },
  SUPORTE_INTERNO: { label: "Suporte Interno", cor: "#1391D6" },
  GESTOR: { label: "Gestor", cor: "#2FB1F8" },
  TECNICO: { label: "Técnico", cor: "#17498A" },
};
export const CARGO_UI_PADRAO = { label: "Não definido", cor: "#6B7280" };

/** Modelo consumido pela UI da tabela de usuários (já mapeado). */
export interface UsuarioListaItem {
  id: string;
  nome: string;
  inicial: string;
  email: string;
  cargoLabel: string;
  cor: string;
  ativo: boolean;
  adicionadoEm: string;
  equipe: string | null;
  /** Hoje o banco não guarda quem cadastrou a conta; vem null. */
  adicionadoPor: string | null;
}

export interface UsuariosPaginados {
  itens: UsuarioListaItem[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface CriarUsuarioPayload {
  nome: string;
  email: string;
  cargo: Cargo;
  senha: string;
}

export interface UsuarioCriadoDTO {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  ativo: boolean;
  senhaProvisoria: boolean;
  equipeId: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type CamposErroCadastroUsuario = Partial<{
  nome: string;
  email: string;
  tipoConta: string;
  senha: string;
}>;

export type CriarUsuarioResultado =
  | { sucesso: true; usuario: UsuarioCriadoDTO | null }
  | {
      sucesso: false;
      erro: string;
      errosCampos?: CamposErroCadastroUsuario;
    };