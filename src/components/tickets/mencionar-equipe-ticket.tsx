"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEquipes } from "@/hooks/use-equipes";
import { LIMITE_RELATORIO_EQUIPE, mencionarEquipe } from "@/lib/mencionar-equipe-client";

export function MencionarEquipeTicket({ ticketId, equipesAssociadas }: {
  ticketId: string;
  equipesAssociadas: string[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const botaoRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  return (
    <div className="pb-4">
      <LogSuggestion
        ref={botaoRef}
        disabled={enviando}
        aria-expanded={aberto}
        aria-controls={aberto ? id : undefined}
        onClick={() => { setAviso(""); setAberto((valor) => !valor); }}
      >
        Mencionar time
      </LogSuggestion>
      <p role="status" className={aviso ? "mt-2 text-sm text-muted-foreground" : "sr-only"}>{aviso}</p>
      {aberto && (
        <FormularioMencao
          id={id}
          ticketId={ticketId}
          associados={new Set(equipesAssociadas)}
          enviando={enviando}
          setEnviando={setEnviando}
          onAdicionado={(equipe) => {
            setAberto(false);
            setAviso(`${equipe.nome} foi adicionado ao ticket. A notificação por e-mail é processada em segundo plano.`);
            requestAnimationFrame(() => botaoRef.current?.focus());
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function FormularioMencao({ id, ticketId, associados, enviando, setEnviando, onAdicionado }: {
  id: string;
  ticketId: string;
  associados: ReadonlySet<string>;
  enviando: boolean;
  setEnviando: (valor: boolean) => void;
  onAdicionado: (equipe: { id: string; nome: string }) => void;
}) {
  const { equipes, carregando, indisponivel } = useEquipes();
  const [equipeId, setEquipeId] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [erro, setErro] = useState("");
  const duplicada = associados.has(equipeId);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const equipe = equipes.find((opcao) => opcao.id === equipeId);
    if (!equipe || enviando) return;
    setErro("");
    setEnviando(true);
    try {
      await mencionarEquipe(ticketId, equipe.id, relatorio, associados);
      onAdicionado(equipe);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível adicionar o time.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form id={id} onSubmit={enviar} className="mt-3 flex max-w-xl flex-col gap-3">
      <fieldset disabled={enviando} className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-time`} className="text-sm font-medium">Time</label>
          <select
            id={`${id}-time`}
            required
            value={equipeId}
            disabled={carregando || indisponivel || equipes.length === 0}
            onChange={(evento) => { setEquipeId(evento.target.value); setErro(""); }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione um time</option>
            {equipes.map((equipe) => (
              <option key={equipe.id} value={equipe.id}>
                {equipe.nome}{associados.has(equipe.id) ? " (já associado)" : ""}
              </option>
            ))}
          </select>
          {carregando && <p role="status" className="text-sm text-muted-foreground">Carregando times…</p>}
          {indisponivel && <p role="alert" className="text-sm text-destructive">Não foi possível carregar os times. Feche e abra a menção para tentar novamente.</p>}
          {!carregando && !indisponivel && !equipes.length && <p className="text-sm text-muted-foreground">Nenhum time ativo encontrado.</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-motivo`} className="text-sm font-medium">Motivo do acionamento</label>
          <Textarea
            id={`${id}-motivo`}
            aria-describedby={`${id}-ajuda`}
            required
            rows={3}
            maxLength={LIMITE_RELATORIO_EQUIPE}
            value={relatorio}
            onChange={(evento) => setRelatorio(evento.target.value)}
          />
          <p id={`${id}-ajuda`} className="text-sm text-muted-foreground">O motivo será incluído no e-mail enviado aos membros ativos do time.</p>
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" className="self-end" formNoValidate={duplicada} disabled={!equipeId || (!relatorio.trim() && !duplicada)}>
          {enviando ? "Adicionando…" : "Adicionar time"}
        </Button>
      </fieldset>
    </form>
  );
}
