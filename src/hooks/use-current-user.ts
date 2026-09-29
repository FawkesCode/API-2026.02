"use client";

/**
 * Placeholder até a autenticação real existir — não encontrei pasta de
 * auth/sessão no projeto. Troque o corpo desta função pela integração
 * com o provedor de sessão real (NextAuth, cookie de sessão, contexto
 * de auth, etc.) assim que ele existir. A interface pública
 * (`UsuarioAtual`, `useCurrentUser()`) pode continuar a mesma para não
 * quebrar quem já consome este hook.
 */
import { USUARIO_MOCK, type UsuarioAtual } from "@/lib/auth/mock-user";

export type { UsuarioAtual };

export function useCurrentUser(): UsuarioAtual {
  return USUARIO_MOCK;
}
