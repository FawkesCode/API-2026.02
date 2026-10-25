import { X } from "lucide-react";

import type { TecnicoEquipe } from "@/types/equipe";
import { formatarDataAdicao } from "@/utils/date";

interface TecnicosSelecionadosProps {
  tecnicos: TecnicoEquipe[];
  onRemover: (id: string) => void;
}

export function TecnicosSelecionados({
  tecnicos,
  onRemover,
}: TecnicosSelecionadosProps) {
  if (tecnicos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum técnico na equipe. Selecione um acima para adicionar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tecnicos.map((tecnico) => (
        <li
          key={tecnico.value}
          className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-900 text-xs font-semibold text-white"
          >
            {tecnico.label.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-card-foreground">
            {tecnico.label}
          </span>
          {tecnico.adicionadoEm && (
            <span className="hidden shrink-0 text-muted-foreground sm:inline">
              Adicionado em {formatarDataAdicao(tecnico.adicionadoEm)}
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemover(tecnico.value)}
            aria-label={`Remover ${tecnico.label}`}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
