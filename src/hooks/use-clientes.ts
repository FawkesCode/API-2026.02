"use client";

import { useEffect, useState } from "react";

/**
 * ATENÇÃO: assumi que GET /api/clientes devolve um array de objetos com
 * { id, nome } (ou { itens: [...] }). Se o formato real for outro, ajuste
 * só o trecho de normalização abaixo.
 */
export interface ClienteResumo {
  id: string;
  nome: string;
}

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      try {
        const resposta = await fetch("/api/clientes");
        if (!resposta.ok) {
          if (ativo) setIndisponivel(true);
          return;
        }
        const dados = await resposta.json();
        const lista: ClienteResumo[] = Array.isArray(dados)
          ? dados
          : (dados?.itens ?? []);
        if (ativo) {
          setClientes(lista.map(({ id, nome }) => ({ id, nome })));
        }
      } catch {
        if (ativo) setIndisponivel(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  return { clientes, carregando, indisponivel };
}