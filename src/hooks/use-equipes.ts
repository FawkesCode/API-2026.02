"use client";

import { useEffect, useState } from "react";

/**
 * Não encontrei GET /api/equipes na árvore do projeto. Este hook tenta
 * chamá-lo mesmo assim; se der 404 (ou qualquer falha), `indisponivel`
 * fica true e quem consome decide o fallback (ex.: usar só a equipe do
 * projeto selecionado).
 */
export interface EquipeResumo {
  id: string;
  nome: string;
}

export function useEquipes() {
  const [equipes, setEquipes] = useState<EquipeResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      try {
        const resposta = await fetch("/api/equipes");
        if (resposta.status === 404) {
          if (ativo) setIndisponivel(true);
          return;
        }
        if (!resposta.ok) throw new Error();
        const dados: EquipeResumo[] = await resposta.json();
        if (ativo) setEquipes(dados);
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

  return { equipes, carregando, indisponivel };
}
