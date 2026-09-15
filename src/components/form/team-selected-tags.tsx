"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { FormLabel } from "@/components/form/form-label"

export interface TeamOption {
  id: string
  nome: string
}

interface TeamSelectedTagsProps {
  label?: string
  required?: boolean
  error?: string
  options: TeamOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

/**
 * Seleção de times em formato de tags. Clicar em uma opção disponível a move
 * para a lista de selecionados; clicar no "x" da tag remove.
 */
export function TeamSelectedTags({
  label = "Times:",
  required,
  error,
  options,
  value,
  onChange,
  placeholder = "Selecione um ou mais times...",
}: TeamSelectedTagsProps) {
  const selected = options.filter((o) => value.includes(o.id))
  const available = options.filter((o) => !value.includes(o.id))

  function addTeam(id: string) {
    onChange([...value, id])
  }

  function removeTeam(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <FormLabel required={required}>{label}</FormLabel>}

      <div
        aria-invalid={!!error}
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2.5",
          "transition-colors duration-150 hover:border-cyan-300",
          "focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-300/40",
          "aria-[invalid=true]:border-destructive"
        )}
      >
        {selected.length === 0 && (
          <span className="px-1 text-sm text-muted-foreground">{placeholder}</span>
        )}

        {selected.map((team) => (
          <span
            key={team.id}
            className="flex items-center gap-1.5 rounded-full bg-cyan-300 py-1 pr-1.5 pl-3 text-xs font-semibold text-white"
          >
            {team.nome}
            <button
              type="button"
              onClick={() => removeTeam(team.id)}
              className="rounded-full p-0.5 transition-colors hover:bg-cyan-400"
              aria-label={`Remover ${team.nome}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {available.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => addTeam(team.id)}
              className={cn(
                "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground",
                "transition-colors duration-150 hover:border-cyan-400 hover:text-cyan-600"
              )}
            >
              + {team.nome}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}