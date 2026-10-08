"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEquipes } from "@/hooks/use-equipes";

interface Props {
  ticketId: string;
  equipesDoTicket: { id: string; nome: string }[];
  equipeDoUsuarioId?: string | null;
}

type Modo = "atribuir" | "desatribuir";

export function GerenciarEquipesTicket({
  ticketId,
  equipesDoTicket,
  equipeDoUsuarioId,
}: Props) {
  const router = useRouter();
  const { equipes, carregando, indisponivel } = useEquipes();
  const [aberto, setAberto] = useState<Modo | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const idsDoTicket = new Set(equipesDoTicket.map((e) => e.id));
  const disponiveis = equipes.filter((e) => !idsDoTicket.has(e.id));

  const opcoes = aberto === "atribuir" ? disponiveis : equipesDoTicket;

  async function executar(modo: Modo, equipe: { id: string; nome: string }) {
    if (modo === "desatribuir") {
      const propria = equipe.id === equipeDoUsuarioId;
      const aviso = propria
        ? `Você é gestor de "${equipe.nome}". Ao remover sua própria equipe, você perderá o acesso a este ticket. Continuar?`
        : `Remover "${equipe.nome}" deste ticket?`;
      if (!window.confirm(aviso)) return;
    }

    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/equipes`, {
        method: modo === "atribuir" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipeId: equipe.id }),
      });
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        throw new Error(corpo?.erro ?? "Não foi possível atualizar as equipes.");
      }
      setAberto(null);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  }

  const botao =
    "inline-flex items-center gap-1 rounded-md border border-input bg-white px-2 py-1 text-xs text-muted-foreground hover:bg-sky-50 disabled:opacity-50";

  return (
    <div className="relative flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {(["atribuir", "desatribuir"] as const).map((modo) => (
          <button
            key={modo}
            type="button"
            disabled={enviando}
            aria-expanded={aberto === modo}
            onClick={() => {
              setErro(null);
              setAberto((atual) => (atual === modo ? null : modo));
            }}
            className={botao}
          >
            {modo === "atribuir" ? "Atribuir equipe" : "Desatribuir equipe"}
            <ChevronDown className="size-3" />
          </button>
        ))}
      </div>

      {aberto && (
        <ul className="absolute right-0 top-full z-20 mt-1 min-w-48 rounded-md border border-input bg-white shadow-md">
          {aberto === "atribuir" && carregando && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Carregando...</li>
          )}
          {aberto === "atribuir" && indisponivel && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              Não foi possível carregar as equipes.
            </li>
          )}
          {!carregando && !indisponivel && opcoes.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {aberto === "atribuir"
                ? "Nenhuma equipe disponível."
                : "Nenhuma equipe atribuída."}
            </li>
          )}
          {opcoes.map((equipe) => (
            <li key={equipe.id}>
              <button
                type="button"
                disabled={enviando}
                onClick={() => executar(aberto, equipe)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-sky-50"
              >
                {equipe.nome}
              </button>
            </li>
          ))}
        </ul>
      )}

      {erro && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}