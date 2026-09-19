"use client";

import { useState } from "react";
import { cn } from "cn";
import { LogEditor } from "@/components/tickets/log-editor";
import { LogState, type LogStatus } from "@/components/tickets/log-states";
import { LogSuggestion } from "@/components/tickets/log-suggestions";
import UserMessages from "@/components/tickets/user-messages";

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

interface TicketLogsProps {
  logsIniciais: Array<LogItem>;
  autor: Autor;
  className?: string;
}

function TicketLogs({ logsIniciais, autor, className }: TicketLogsProps) {
  const [logs, setLogs] = useState(logsIniciais);

  // TODO: trocar por POST no endpoint de histórico quando existir
  function adicionarAviso(
    status: LogStatus,
    titulo: string,
    descricao: string,
  ) {
    setLogs((anteriores) => [
      ...anteriores,
      { id: crypto.randomUUID(), tipo: "aviso", status, titulo, descricao },
    ]);
  }

  function adicionarLogManual({
    titulo,
    conteudo,
  }: {
    titulo: string;
    conteudo: string;
  }) {
    setLogs((anteriores) => [
      ...anteriores,
      {
        id: crypto.randomUUID(),
        tipo: "manual",
        autorId: autor.id,
        autorNome: autor.nome,
        equipe: autor.equipe,
        setor: autor.setor,
        titulo: titulo || "Log sem título",
        descricao: conteudo,
        criadoEm: new Date(),
      },
    ]);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto  border-x border-gray-200 bg-slate-100 p-6">
        <h3 className="font-bold text-card-foreground">LOGS DE ATIVIDADE</h3>

        {logs.map((log) =>
          log.tipo === "aviso" ? (
            <LogState
              key={log.id}
              status={log.status}
              titulo={log.titulo}
              descricao={log.descricao}
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
            onClick={() =>
              adicionarAviso(
                "iniciado",
                `Equipe ${autor.equipe} começou a trabalhar no ticket`,
                `${autor.nome} deu início a atividade`,
              )
            }
          >
            Enviar &quot;Equipe Começou a trabalhar&quot;
          </LogSuggestion>
          <LogSuggestion
            onClick={() =>
              adicionarAviso(
                "solicitado",
                `Equipe ${autor.equipe} solicitou encerramento do ticket`,
                `${autor.nome} realizou a solicitação`,
              )
            }
          >
            Enviar &quot;Solicito Encerramento do Ticket&quot;
          </LogSuggestion>
        </div>
        <LogEditor onEnviar={adicionarLogManual} />
      </section>
    </div>
  );
}

export { TicketLogs, type LogItem, type Autor };
