"use client";

import { useState } from "react";
import { PriorityButton } from "@/components/priority-button";
import {
  PRIORITY_LABEL_TO_LEVEL,
  PRIORITY_LABELS,
  PRIORITY_LEVEL_TO_ENUM,
  PRIORITY_LEVELS,
  type Priority,
} from "@/lib/priority";

interface RespostaDeErro {
  erro?: string;
}

interface PriorityEditorProps {
  ticketId: string;
  priority: string;
}

function PriorityEditor({ ticketId, priority }: PriorityEditorProps) {
  const nivelInicial = PRIORITY_LABEL_TO_LEVEL[priority] ?? "medium";
  const [nivelAtual, setNivelAtual] = useState<Priority>(nivelInicial);
  const [selecionado, setSelecionado] = useState<Priority>(nivelInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const alterou = selecionado !== nivelAtual;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    setSalvo(false);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prioridade: PRIORITY_LEVEL_TO_ENUM[selecionado] }),
      });

      const resposta = (await res.json().catch(() => null)) as RespostaDeErro | null;

      if (!res.ok) {
        throw new Error(
          resposta?.erro ?? "Não foi possível salvar a prioridade. Tente novamente.",
        );
      }

      setNivelAtual(selecionado);
      setSalvo(true);
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível salvar a prioridade. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div
        role="radiogroup"
        aria-label="Prioridade do ticket"
        className="flex items-center gap-1.5"
      >
        {PRIORITY_LEVELS.map((nivel) => (
          <PriorityButton
            key={nivel}
            type="button"
            priority={nivel}
            selected={selecionado === nivel}
            role="radio"
            aria-checked={selecionado === nivel}
            onClick={() => {
              setSelecionado(nivel);
              setSalvo(false);
            }}
          >
            {PRIORITY_LABELS[nivel]}
          </PriorityButton>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {erro && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erro}
          </p>
        )}
        {salvo && !erro && (
          <p className="text-xs font-medium text-green-600">Prioridade atualizada.</p>
        )}
        <button
          type="button"
          onClick={salvar}
          disabled={!alterou || salvando}
          className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-cyan-500 disabled:pointer-events-none disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

export { PriorityEditor };
