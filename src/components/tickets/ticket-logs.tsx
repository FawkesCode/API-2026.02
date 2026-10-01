"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { LogEditor } from "@/components/tickets/log-editor";
import { LogState, type LogStatus } from "@/components/tickets/log-states";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import UserMessages from "@/components/tickets/user-messages";
import { EventoLog, toLogItem } from "@/lib/mappers/historico.mapper";
import { logRespostaSchema } from "@/schemas/historico.schema";

interface Autor {
  id: string;
  nome: string;
  equipe: string;
  setor: string;
}

type LogItem =
  | {
      id: string;
      tipo: "aviso";
      status: LogStatus;
      titulo: string;
      descricao: string;
      criadoEm: Date;
    }
  | {
      id: string;
      tipo: "manual";
      autorId: string;
      autorNome: string;
      equipe: string;
      setor: string;
      titulo: string;
      descricao: string;
      criadoEm: Date;
    };

interface NovoLog {
  evento: string;
  descricao: string;
  usuarioId: string;
}

interface RespostaDeErro {
  erro?: string;
  detalhes?: Record<string, string[] | undefined>;
}

function mensagemDeErro(status: number, resposta: RespostaDeErro | null) {
  const detalhe = Object.values(resposta?.detalhes ?? {}).flat()[0];

  if (status === 400 && detalhe) return detalhe;
  if (status === 400 && resposta?.erro) return resposta.erro;
  if (status === 403) {
    return (
      resposta?.erro ?? "Você não tem acesso para registrar logs neste ticket."
    );
  }
  if (status === 404) {
    return "Ticket não encontrado. Atualize a página e tente novamente.";
  }

  return "Não foi possível enviar o log. Tente novamente.";
}

async function publicarLog(ticketId: string, log: NovoLog) {
  const res = await fetch(`/api/tickets/${ticketId}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(log),
  });

  const resposta = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(mensagemDeErro(res.status, resposta));
  }

  const logCriado = logRespostaSchema.safeParse(resposta);
  if (!logCriado.success) {
    throw new Error(
      "O log foi registrado, mas não pôde ser exibido. Atualize a página para visualizá-lo.",
    );
  }

  return toLogItem(logCriado.data);
}

interface TicketLogsProps {
  ticketId: string;
  logsIniciais: Array<LogItem>;
  autor: Autor;
  className?: string;
}

function TicketLogs({
  ticketId,
  logsIniciais,
  autor,
  className,
}: TicketLogsProps) {
  const [logs, setLogs] = useState(logsIniciais);
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [erroAviso, setErroAviso] = useState<string | null>(null);
  const listaRef = useRef<HTMLElement>(null);
  const jaRenderizou = useRef(false);
  const forcarRolagem = useRef(false);
  const pertoDoFim = useRef(true);

  function aoRolar() {
    const lista = listaRef.current;
    if (!lista) return;

    pertoDoFim.current =
      lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
  }

  // Abre a lista já no final. Depois disso, só desce quando o próprio usuário
  // publica um log ou quando ele já estava lendo o fim da conversa; quem está
  // lendo logs antigos não perde a posição.
  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;

    const primeiraRenderizacao = !jaRenderizou.current;

    if (primeiraRenderizacao || forcarRolagem.current || pertoDoFim.current) {
      lista.scrollTo({
        top: lista.scrollHeight,
        behavior: primeiraRenderizacao ? "auto" : "smooth",
      });
    }

    jaRenderizou.current = true;
    forcarRolagem.current = false;
  }, [logs]);

  async function registrarLog(evento: string, descricao: string) {
    const log = await publicarLog(ticketId, {
      evento,
      descricao,
      usuarioId: autor.id,
    });

    // Log novo vai para o final da lista (ordem cronológica, como em um chat).
    forcarRolagem.current = true;
    setLogs((anteriores) => [...anteriores, log]);
  }

  async function enviarAviso(evento: string, descricao: string) {
    setErroAviso(null);
    setEnviandoAviso(true);

    try {
      await registrarLog(evento, descricao);
    } catch (erro) {
      setErroAviso(
        erro instanceof Error
          ? erro.message
          : "Não foi possível enviar o log. Tente novamente.",
      );
    } finally {
      setEnviandoAviso(false);
    }
  }

  async function enviarLogManual({
    titulo,
    conteudo,
  }: {
    titulo: string;
    conteudo: string;
  }) {
    await registrarLog(titulo, conteudo);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <section
        ref={listaRef}
        onScroll={aoRolar}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto scrollbar-none border-x border-gray-200 bg-slate-100 p-6"
      >
        <h3 className="sticky top-0 z-10 -mx-6 -mt-6 bg-slate-100 px-6 py-3 font-bold text-card-foreground">
          LOGS DE ATIVIDADE
        </h3>

        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum log registrado para este ticket ainda.
          </p>
        ) : null}

        {logs.map((log) =>
          log.tipo === "aviso" ? (
            <LogState
              key={log.id}
              status={log.status}
              titulo={log.titulo}
              descricao={log.descricao}
              criadoEm={log.criadoEm}
            />
          ) : (
            <UserMessages
              key={log.id}
              team={log.equipe}
              sector={log.setor}
              title={log.titulo}
              userName={log.autorNome}
              description={log.descricao}
              date={log.criadoEm}
              align={log.autorId === autor.id ? "right" : "left"}
            />
          ),
        )}
      </section>

      <section className="shrink-0 rounded-b-md border  border-gray-200 bg-white p-6">
        <div className="flex flex-wrap gap-2 pb-4">
          <LogSuggestion
            disabled={enviandoAviso}
            onClick={() =>
              enviarAviso(
                EventoLog.AtividadeIniciada,
                `${autor.nome} deu início a atividade`,
              )
            }
          >
            Enviar &quot;Equipe Começou a trabalhar&quot;
          </LogSuggestion>
          <LogSuggestion
            disabled={enviandoAviso}
            onClick={() =>
              enviarAviso(
                EventoLog.EncerramentoSolicitado,
                `${autor.nome} realizou a solicitação`,
              )
            }
          >
            Enviar &quot;Solicito Encerramento do Ticket&quot;
          </LogSuggestion>
        </div>
        {erroAviso && (
          <p role="alert" className="pb-4 text-sm font-medium text-destructive">
            {erroAviso}
          </p>
        )}
        <LogEditor onEnviar={enviarLogManual} />
      </section>
    </div>
  );
}

export { TicketLogs, type LogItem, type Autor };