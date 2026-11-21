"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { FormSelect, FormTextarea } from "@/components/form/form-field";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogDivider,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useEquipes } from "@/hooks/use-equipes";
import {
  LIMITE_RELATORIO_EQUIPE,
  mencionarEquipe,
} from "@/lib/mencionar-equipe-client";

export function MencionarEquipeTicket({
  ticketId,
  equipesAssociadas,
}: {
  ticketId: string;
  equipesAssociadas: string[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const associados = useMemo(
    () => new Set(equipesAssociadas),
    [equipesAssociadas],
  );

  function aoMudarAbertura(proximoEstado: boolean) {
    if (enviando) return;
    setAberto(proximoEstado);
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger
        render={
          <LogSuggestion disabled={enviando}>Mencionar time</LogSuggestion>
        }
      />

      {aberto && (
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mencionar time</DialogTitle>
            <DialogDivider />
            <DialogDescription>
              Selecione um time para adicionar ao ticket e informe a razão do
              acionamento. O motivo será enviado por e-mail aos membros ativos
              do time.
            </DialogDescription>
          </DialogHeader>

          <FormularioMencao
            ticketId={ticketId}
            associados={associados}
            enviando={enviando}
            setEnviando={setEnviando}
            onCancelar={() => aoMudarAbertura(false)}
            onAdicionado={(equipe) => {
              setAberto(false);
              toast.add({
                type: "success",
                title: "Time adicionado ao ticket",
                description: `${equipe.nome} foi adicionado ao ticket. A notificação por e-mail é processada em segundo plano.`,
              });
              router.refresh();
            }}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function FormularioMencao({
  ticketId,
  associados,
  enviando,
  setEnviando,
  onCancelar,
  onAdicionado,
}: {
  ticketId: string;
  associados: ReadonlySet<string>;
  enviando: boolean;
  setEnviando: (valor: boolean) => void;
  onCancelar: () => void;
  onAdicionado: (equipe: { id: string; nome: string }) => void;
}) {
  const { equipes, carregando, indisponivel } = useEquipes();
  const [equipeId, setEquipeId] = useState("");
  const [relatorio, setRelatorio] = useState("");
  const [erro, setErro] = useState("");

  const duplicada = associados.has(equipeId);
  const opcoes = useMemo(
    () =>
      equipes.map((equipe) => ({
        value: equipe.id,
        label: `${equipe.nome}${associados.has(equipe.id) ? " (já associado)" : ""}`,
      })),
    [equipes, associados],
  );
  const opcaoSelecionada =
    opcoes.find((opcao) => opcao.value === equipeId) ?? null;

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
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível adicionar o time.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col">
      <DialogBody>
        <div className="flex flex-col gap-1.5">
          <FormSelect
            label="Time:"
            required
            placeholder={
              carregando ? "Carregando times..." : "Selecione um time"
            }
            options={opcoes}
            value={opcaoSelecionada}
            disabled={enviando || carregando || indisponivel || equipes.length === 0}
            className="bg-white shadow-2xs"
            onChange={(opcao) => {
              setEquipeId(opcao?.value ?? "");
              setErro("");
            }}
          />
          {indisponivel && (
            <p role="alert" className="text-xs font-medium text-destructive">
              Não foi possível carregar os times. Feche e abra a menção para
              tentar novamente.
            </p>
          )}
          {!carregando && !indisponivel && equipes.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum time ativo encontrado.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FormTextarea
            label="Motivo do acionamento:"
            required
            rows={4}
            maxLength={LIMITE_RELATORIO_EQUIPE}
            disabled={enviando}
            placeholder="Descreva a razão pela qual está acionando este time..."
            value={relatorio}
            onChange={(evento) => {
              setRelatorio(evento.target.value);
              if (erro) setErro("");
            }}
          />
          <p className="text-xs text-muted-foreground">
            O motivo será incluído no e-mail enviado aos membros ativos do time.
          </p>
        </div>

        {erro && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erro}
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={enviando}
          onClick={onCancelar}
          className="rounded-xl bg-white"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          formNoValidate={duplicada}
          disabled={enviando || !equipeId || (!relatorio.trim() && !duplicada)}
          className="min-w-40 rounded-xl bg-cyan-400 text-white hover:bg-cyan-500"
        >
          {enviando ? "Adicionando..." : "Adicionar time"}
        </Button>
      </DialogFooter>
    </form>
  );
}
