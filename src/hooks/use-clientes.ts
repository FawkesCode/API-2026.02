"use client";

import { useEffect, useState } from "react";
import { listarClientesParaSelecao, type ClienteResumo } from "@/lib/clientes-client";

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    const controle = new AbortController();
    listarClientesParaSelecao(controle.signal)
      .then((lista) => {
        if (!controle.signal.aborted) setClientes(lista);
      })
      .catch(() => {
        if (!controle.signal.aborted) setIndisponivel(true);
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });
    return () => controle.abort();
  }, []);

  return { clientes, carregando, indisponivel };
}
