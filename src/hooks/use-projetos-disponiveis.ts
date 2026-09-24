"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

/**
 * Ajuste os campos abaixo se o retorno real de GET /api/projetos tiver
 * um formato diferente (por exemplo, se `cliente`/`equipe` vierem com
 * outro nome de relação). Só tive acesso ao POST desse endpoint.
 */
export interface ProjetoResumo {
  id: string;
  nome: string;
  clienteId: string;
  cliente?: { nome: string } | null;
  equipeId: string;
  equipe?: { nome: string } | null;
}

export function useProjetosDisponiveis() {
  const usuario = useCurrentUser();
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const resposta = await fetch("/api/projetos");
        if (!resposta.ok) {
          throw new Error("Não foi possível carregar os projetos.");
        }
        const dados: ProjetoResumo[] = await resposta.json();
        if (!ativo) return;

        // "que apareçam os que estejam atrelados à atual equipe"
        const filtrados = usuario.equipeId
          ? dados.filter((projeto) => projeto.equipeId === usuario.equipeId)
          : dados;

        setProjetos(filtrados);
      } catch (erroCapturado) {
        if (!ativo) return;
        setErro(
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Erro ao carregar projetos.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [usuario.equipeId]);

  return { projetos, carregando, erro };
}
