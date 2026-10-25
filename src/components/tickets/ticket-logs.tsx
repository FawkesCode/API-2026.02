"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { LogEditor } from "@/components/tickets/log-editor";
import { LogState } from "@/components/tickets/log-states";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import UserMessages from "@/components/tickets/user-messages";
import {
  EventoLog,
  toLogItem,
  type Autor,
  type LogItem,
} from "@/lib/mappers/historico.mapper";
import { logRespostaSchema } from "@/schemas/historico.schema";

interface NovoLog {
  evento: string;
  descricao: string;
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
  autor: Autor | null;
  status: string;
  podeRegistrar: boolean;
  podeDecidir: boolean;
  /** Se a equipe do usuário já enviou "começou a trabalhar" neste ticket. */
  equipeIniciou: boolean;
  className?: string;
}

function TicketLogs({
  ticketId,
  logsIniciais,
  autor,
  className,
  status,
  podeRegistrar,
  podeDecidir,
  equipeIniciou,
}: TicketLogsProps) {
  const router = useRouter();

  const [logs, setLogs] = useState(logsIniciais);
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [erroAviso, setErroAviso] = useState<string | null>(null);
  const [recusando, setRecusando] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  const podeIniciar =
    !equipeIniciou &&
    ["Não iniciado", "Em andamento", "Em revisão"].includes(status);
  const podeSolicitarEncerramento =
    equipeIniciou && ["Em andamento", "Em revisão"].includes(status);
  const podeDecidirAgora =
    podeDecidir && status === "Solicitação de encerramento";

  const listaRef = useRef<HTMLElement>(null);
  const jaRenderizou = useRef(false);
  const forcarRolagem = useRef(false);
  const pertoDoFim = useRef(true);
  const rolagemDoCodigo = useRef(false);

  function aoRolar() {
    const lista = listaRef.current;

    if (!lista) return;

    // O evento de uma rolagem feita aqui pode chegar depois de a lista
    // encolher; ele não significa que o usuário saiu do fim.
    if (rolagemDoCodigo.current) {
      rolagemDoCodigo.current = false;
      return;
    }

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

    if (
      primeiraRenderizacao ||
      forcarRolagem.current ||
      pertoDoFim.current
    ) {
      rolagemDoCodigo.current = true;
      pertoDoFim.current = true;
      lista.scrollTo({
        top: lista.scrollHeight,
        behavior: primeiraRenderizacao ? "auto" : "smooth",
      });
    }

    jaRenderizou.current = true;
    forcarRolagem.current = false;
  }, [logs]);

  // A lista encolhe quando a área de envio cresce (o editor monta depois da
  // primeira rolagem, a justificativa da recusa abre); quem estava no fim
  // continua vendo os logs mais recentes.
  useEffect(() => {
    const lista = listaRef.current;

    if (!lista) return;

    const observador = new ResizeObserver(() => {
      const fim = lista.scrollHeight - lista.clientHeight;
      // Já no fim, mudar scrollTop não gera evento e a marca ficaria presa.
      if (!pertoDoFim.current || lista.scrollTop >= fim - 1) return;
      rolagemDoCodigo.current = true;
      lista.scrollTop = lista.scrollHeight;
    });
    observador.observe(lista);

    return () => observador.disconnect();
  }, []);

  async function registrarLog(evento: string, descricao: string) {
    const log = await publicarLog(ticketId, {
      evento,
      descricao,
    });

    // Log novo vai para o final da lista (ordem cronológica, como em um chat).
    forcarRolagem.current = true;
    setLogs((anteriores) => [...anteriores, log]);

    router.refresh();
  }

  async function enviarAviso(evento: string, descricao: string) {
    setErroAviso(null);
    setEnviandoAviso(true);

    try {
      await registrarLog(evento, descricao);
      setRecusando(false);
      setJustificativa("");
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
        <h3 className="font-bold text-card-foreground">
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
              titulo={log.tituloTrechos.map((trecho, indice) =>
                trecho.destaque ? (
                  <em key={indice}>{trecho.texto}</em>
                ) : (
                  trecho.texto
                ),
              )}
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
              align={log.autorId === autor?.id ? "right" : "left"}
            />
          ),
        )}
      </section>

      {podeRegistrar && autor && (
        <section className="shrink-0 rounded-b-md border border-gray-200 bg-white p-6">
          {(podeIniciar || podeSolicitarEncerramento || podeDecidirAgora) && (
            <div className="flex flex-wrap gap-2 pb-4">
              {podeIniciar && (
                <LogSuggestion
                  disabled={enviandoAviso}
                  onClick={() =>
                    enviarAviso(
                      EventoLog.AtividadeIniciada,
                      `${autor.nome} deu início a atividade`,
                    )
                  }
                >
                  Enviar &quot;Equipe começou a trabalhar no ticket&quot;
                </LogSuggestion>
              )}

              {podeSolicitarEncerramento && (
                <LogSuggestion
                  disabled={enviandoAviso}
                  onClick={() =>
                    enviarAviso(
                      EventoLog.EncerramentoSolicitado,
                      `${autor.nome} realizou a solicitação`,
                    )
                  }
                >
                  Enviar &quot;Solicito encerramento do ticket&quot;
                </LogSuggestion>
              )}

              {podeDecidirAgora && (
                <>
                  <LogSuggestion
                    tone="approve"
                    disabled={enviandoAviso}
                    onClick={() =>
                      enviarAviso(
                        EventoLog.EncerramentoAprovado,
                        `${autor.nome} aprovou a solicitação de encerramento`,
                      )
                    }
                  >
                    Aprovar encerramento
                  </LogSuggestion>

                  <LogSuggestion
                    tone="deny"
                    disabled={enviandoAviso}
                    aria-expanded={recusando}
                    onClick={() => setRecusando((aberto) => !aberto)}
                  >
                    Recusar encerramento
                  </LogSuggestion>
                </>
              )}
            </div>
          )}

          {podeDecidirAgora && recusando && (
            <div className="flex flex-col gap-2 pb-4">
              <label
                htmlFor="justificativa-recusa"
                className="text-sm font-medium text-foreground"
              >
                Justificativa da recusa
              </label>
              <textarea
                id="justificativa-recusa"
                value={justificativa}
                onChange={(evento) => setJustificativa(evento.target.value)}
                rows={3}
                placeholder="Explique o que ainda precisa ser feito..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus-visible:border-ring"
              />
              <div className="flex justify-end gap-2">
                <LogSuggestion
                  disabled={enviandoAviso}
                  onClick={() => {
                    setRecusando(false);
                    setJustificativa("");
                  }}
                >
                  Cancelar
                </LogSuggestion>
                <LogSuggestion
                  tone="deny"
                  disabled={enviandoAviso || !justificativa.trim()}
                  onClick={() =>
                    enviarAviso(
                      EventoLog.EncerramentoNegado,
                      justificativa.trim(),
                    )
                  }
                >
                  Confirmar recusa
                </LogSuggestion>
              </div>
            </div>
          )}

          {erroAviso && (
            <p
              role="alert"
              className="pb-4 text-sm font-medium text-destructive"
            >
              {erroAviso}
            </p>
          )}

          <LogEditor onEnviar={enviarLogManual} />
        </section>
      )}
    </div>
  );
}

export default TicketLogs;