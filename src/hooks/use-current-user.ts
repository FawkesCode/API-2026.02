"use client";

/**
 * Placeholder até a autenticação real existir — não encontrei pasta de
 * auth/sessão no projeto. Troque o corpo desta função pela integração
 * com o provedor de sessão real (NextAuth, cookie de sessão, contexto
 * de auth, etc.) assim que ele existir. A interface pública
 * (`UsuarioAtual`, `useCurrentUser()`) pode continuar a mesma para não
 * quebrar quem já consome este hook.
 */
import { Cargo } from "@/lib/ticket-enums";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  equipeId: string | null;
}

const USUARIO_MOCK: UsuarioAtual = {
  id: "3c14cfc8-b3ae-11f1-9aeb-0ea8acf6b539",
  nome: "Nome do Usuário",
  email: "email@gmail.com",
  cargo: Cargo.SUPORTE,
  equipeId: null,
};

export function useCurrentUser(): UsuarioAtual {
  return USUARIO_MOCK;
}
