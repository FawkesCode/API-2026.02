"use client";

import { useContext } from "react";
import { CurrentUserContext } from "@/components/current-user-provider";
import type { UsuarioAtual } from "@/types/usuario";

export type { UsuarioAtual };

export function useCurrentUser(): UsuarioAtual | null {
  return useContext(CurrentUserContext);
}
