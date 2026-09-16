import * as React from "react"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  codigo: string
  nome: string
  cliente: string
  localInstalacao: string
  descricao: string
  qtdTickets?: number
  adicionadoPor?: string
  /** Aplica o destaque de card selecionado visto no mockup. */
  selected?: boolean
  /** Quando ausente, o card é apenas informativo e não renderiza elemento focável. */
  onClick?: () => void
  className?: string
}

export function ProjectCard({
  codigo,
  nome,
  cliente,
  localInstalacao,
  descricao,
  qtdTickets = 0,
  adicionadoPor = "Usuário",
  selected = false,
  onClick,
  className,
}: ProjectCardProps) {
  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 rounded-xl bg-card p-5 text-left",
        "transition-colors duration-150",
        onClick && "hover:border-accent",
        selected ? "border-2 border-accent" : "border border-border",
        className
      )}
    >
      {/* Botão sobreposto: mantém o card inteiro clicável sem aninhar
          conteúdo de bloco (h3/p/div) dentro de um <button>, o que é HTML inválido. */}
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={selected}
          className={cn(
            "absolute inset-0 z-10 rounded-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          )}
        >
          <span className="sr-only">
            {selected ? "Desmarcar" : "Selecionar"} projeto {nome}
          </span>
        </button>
      )}

      <span className="text-xs font-semibold tracking-wide text-accent uppercase">
        COD PROJ: {codigo}
      </span>
      <h3 className="text-lg font-bold text-blue-950">{nome}</h3>
      <p className="text-sm font-medium text-foreground">
        {cliente} | {localInstalacao}
      </p>
      <p className="line-clamp-3 text-sm text-muted-foreground">{descricao}</p>
      <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-2">
        <span className="text-xs font-semibold text-accent">
          Qtd Tickets: {qtdTickets}
        </span>
        <span className="text-xs text-muted-foreground">
          Adicionado por <span className="italic">{adicionadoPor}</span>
        </span>
      </div>
    </article>
  )
}