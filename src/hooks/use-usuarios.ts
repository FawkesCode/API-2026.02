"use client";

import { useEffect, useState } from "react";

/**
 * ATENÇÃO: assumi que GET /api/usuarios devolve um array de objetos com
 * { id, nome } (ou { itens: [...] }). Se o formato real for outro, ajuste
 * só o trecho de normalização abaixo.
 */
export interface UsuarioResumo {
  id: string;
  nome: string;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      try {
        const resposta = await fetch("/api/usuarios");
        if (!resposta.ok) {
          if (ativo) setIndisponivel(true);
          return;
        }
        const dados = await resposta.json();
        const lista: UsuarioResumo[] = Array.isArray(dados)
          ? dados
          : (dados?.itens ?? []);
        if (ativo) {
          setUsuarios(lista.map(({ id, nome }) => ({ id, nome })));
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

  return { usuarios, carregando, indisponivel };
}