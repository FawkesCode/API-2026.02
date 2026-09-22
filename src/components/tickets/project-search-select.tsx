"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  useProjetosDisponiveis,
  type ProjetoResumo,
} from "@/hooks/use-projetos-disponiveis";

interface ProjectSearchSelectProps {
  onSelect: (projeto: ProjetoResumo) => void;
}

/**
 * "form de busca" descrito: mostra os projetos cabíveis ao usuário (já
 * filtrados por equipe em useProjetosDisponiveis) com uma barra de
 * pesquisa por nome/cliente em cima.
 */
export function ProjectSearchSelect({ onSelect }: ProjectSearchSelectProps) {
  const { projetos, carregando, erro } = useProjetosDisponiveis();
  const [busca, setBusca] = React.useState("");

  const termo = busca.trim().toLowerCase();
  const projetosFiltrados = projetos.filter((projeto) => {
    if (!termo) return true;
    return (
      projeto.nome.toLowerCase().includes(termo) ||
      projeto.cliente?.nome?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Pesquisar projeto pelo nome ou cliente..."
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        autoFocus
      />

      {carregando && (
        <p className="text-sm text-muted-foreground">Carregando projetos...</p>
      )}
      {erro && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}
      {!carregando && !erro && projetosFiltrados.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum projeto encontrado.
        </p>
      )}

      <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
        {projetosFiltrados.map((projeto) => (
          <li key={projeto.id}>
            <button
              type="button"
              onClick={() => onSelect(projeto)}
              className="w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-sky-50"
            >
              <span className="font-semibold">{projeto.nome}</span>
              {projeto.cliente?.nome && (
                <span className="ml-1 text-muted-foreground">
                  — {projeto.cliente.nome}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
