import { Cargo } from "@/lib/ticket-enums";

/** Identidade compartilhada do usuário de suporte usado no protótipo. */
export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}

export const USUARIO_MOCK: UsuarioAtual = {
  id: "9f0155e7-bdcf-11f1-9ff7-eafd7d88e733",
  nome: "Gestor Teste",
  email: "gestor@teste.com",
  cargo: Cargo.GESTOR,
  equipeId: "37391a3c-bdd0-11f1-9ff7-eafd7d88e733",
};