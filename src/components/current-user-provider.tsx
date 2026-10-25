"use client";

import { createContext, type ReactNode } from "react";
import type { UsuarioAtual } from "@/types/usuario";

export const CurrentUserContext = createContext<UsuarioAtual | null>(null);

export function CurrentUserProvider({
  usuario,
  children,
}: {
  usuario: UsuarioAtual | null;
  children: ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={usuario}>
      {children}
    </CurrentUserContext.Provider>
  );
}
