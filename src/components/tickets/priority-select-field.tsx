"use client";

import { Prioridade } from "@/lib/ticket-enums";
import { PriorityButton } from "@/components/priority-button";
import { FormLabel } from "@/components/form/form-label";
import { PRIORITY_LABELS, type Priority } from "@/lib/priority";

const PRIORIDADE_PARA_PRIORITY: Record<Prioridade, Priority> = {
  [Prioridade.BAIXA]: "low",
  [Prioridade.MEDIA]: "medium",
  [Prioridade.ALTA]: "high",
  [Prioridade.CRITICA]: "critical",
};

const ORDEM: Prioridade[] = [
  Prioridade.BAIXA,
  Prioridade.MEDIA,
  Prioridade.ALTA,
  Prioridade.CRITICA,
];

interface PrioritySelectFieldProps {
  value?: Prioridade;
  onChange: (valor: Prioridade) => void;
  error?: string;
}

export function PrioritySelectField({
  value,
  onChange,
  error,
}: PrioritySelectFieldProps) {
  const errorId = "prioridade-sla-error";

  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel required>Prioridade e SLA</FormLabel>
      <div
        className="flex flex-wrap gap-2 justify-center"
        role="radiogroup"
        aria-describedby={error ? errorId : undefined}
      >
        {ORDEM.map((prioridade) => {
          const priority = PRIORIDADE_PARA_PRIORITY[prioridade];
          return (
            <PriorityButton
              key={prioridade}
              priority={priority}
              selected={value === prioridade}
              aria-pressed={value === prioridade}
              onClick={() => onChange(prioridade)}
              className="min-w-28 cursor-pointer text-sm"
            >
              {PRIORITY_LABELS[priority]}
            </PriorityButton>
          );
        })}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
