"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FALHA_LISTAR_MENSAGENS_PADRAO,
  listarMensagensPadraoLog,
  type MensagemPadraoLog,
} from "@/lib/mensagens-padrao-log-client";

/** Só busca quando `habilitado` (ex.: na primeira abertura da lista). */
export function useMensagensPadraoLog(habilitado = true) {
  const [mensagens, setMensagens] = useState<MensagemPadraoLog[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    const controle = new AbortController();

    listarMensagensPadraoLog(controle.signal)
      .then((lista) => {
        if (controle.signal.aborted) return;
        setMensagens(lista);
        setErro(null);
      })
      .catch((falha) => {
        if (controle.signal.aborted) return;
        setErro(
          falha instanceof Error ? falha.message : FALHA_LISTAR_MENSAGENS_PADRAO,
        );
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [habilitado, tentativa]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    setTentativa((valor) => valor + 1);
  }, []);

  return { mensagens, carregando, erro, recarregar };
}
