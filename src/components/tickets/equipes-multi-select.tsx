"use client";

/**
 * Reescrito para bater com o mockup original: um dropdown
 * "Selecione uma opção" que, ao escolher, adiciona a equipe como um
 * chip removível logo abaixo (clicar no "x" do chip remove).
 *
 * Este componente é autocontido (não depende de ui/select.tsx nem de
 * ui/popover.tsx) justamente porque a API real desses componentes
 * ainda não foi confirmada — assim que eu tiver o conteúdo de
 * ui/select.tsx dá pra decidir se vale a pena trocar por ele.
 */
import * as React from "react";
import { ChevronDown, X } from "lucide-react";

interface EquipeOpcao {
  id: string;
  nome: string;
}

interface EquipesMultiSelectProps {
  opcoes: EquipeOpcao[];
  selecionadas: string[];
  onChange: (idsSelecionados: string[]) => void;
}

export function EquipesMultiSelect({
  opcoes,
  selecionadas,
  onChange,
}: EquipesMultiSelectProps) {
  const [aberto, setAberto] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(evento.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const disponiveis = opcoes.filter((o) => !selecionadas.includes(o.id));
  const selecionadasObjetos = opcoes.filter((o) => selecionadas.includes(o.id));

  function adicionar(id: string) {
    onChange([...selecionadas, id]);
    setAberto(false);
  }

  function remover(id: string) {
    onChange(selecionadas.filter((atual) => atual !== id));
  }

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          aria-expanded={aberto}
          className="flex w-full items-center justify-between rounded-xl border border-input bg-white px-3 py-2 text-sm text-muted-foreground shadow-2xs"
        >
          Selecione uma opção
          <ChevronDown className="size-4" />
        </button>

        {aberto && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-input bg-white shadow-md">
            {disponiveis.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma equipe disponível.
              </li>
            )}
            {disponiveis.map((opcao) => (
              <li key={opcao.id}>
                <button
                  type="button"
                  onClick={() => adicionar(opcao.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                >
                  {opcao.nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selecionadasObjetos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selecionadasObjetos.map((opcao) => (
            <span
              key={opcao.id}
              className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
            >
              {opcao.nome}
              <button
                type="button"
                onClick={() => remover(opcao.id)}
                aria-label={`Remover ${opcao.nome}`}
                className="text-sky-600 hover:text-sky-900"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
