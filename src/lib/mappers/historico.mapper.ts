import type { Cargo } from "@/lib/generated/prisma/client";
import type { LogTicketComUsuario } from "@/services/historico.service";
import type { LogStatus } from "@/components/tickets/log-states";

export interface Autor {
  id: string;
  nome: string;
  equipe: string;
  setor: string;
}

/** Pedaço do título de um aviso; `destaque` marca nomes (equipe, gestor). */
export interface TrechoTitulo {
  texto: string;
  destaque?: boolean;
}

export type LogItem =
  | {
    id: string;
    tipo: "aviso";
    status: LogStatus;
    titulo: string;
    tituloTrechos: TrechoTitulo[];
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

export const EventoLog = {
  AtividadeIniciada: "ATIVIDADE_INICIADA",
  EncerramentoSolicitado: "ENCERRAMENTO_SOLICITADO",
  EncerramentoAprovado: "ENCERRAMENTO_APROVADO",
  EncerramentoNegado: "ENCERRAMENTO_NEGADO",
  PrioridadeAlterada: "PRIORIDADE_ALTERADA",
} as const;

type EventoAutomatico = (typeof EventoLog)[keyof typeof EventoLog];

const EVENTOS_AUTOMATICOS = new Set<string>(Object.values(EventoLog));

const CargoLabel: Record<Cargo, string> = {
  TECNICO: "Técnico",
  GESTOR: "Gestor",
  SUPORTE: "Suporte",
  SUPORTE_INTERNO: "Suporte Interno",
  COMERCIAL: "Comercial",
};

/** "Equipe Massa" e "Massa" viram ["Equipe ", *Massa*], como no design. */
function trechosDaEquipe(equipe: string): TrechoTitulo[] {
  const nome = equipe.replace(/^equipe\s+/i, "");
  return [{ texto: "Equipe " }, { texto: nome, destaque: true }];
}

interface AutorDoAviso {
  equipe: string;
  nome: string;
}

const AvisoPorEvento: Record<
  EventoAutomatico,
  { status: LogStatus; titulo: (autor: AutorDoAviso) => TrechoTitulo[] }
> = {
  [EventoLog.AtividadeIniciada]: {
    status: "iniciado",
    titulo: ({ equipe }) => [
      ...trechosDaEquipe(equipe),
      { texto: " começou a trabalhar no ticket" },
    ],
  },
  [EventoLog.EncerramentoSolicitado]: {
    status: "solicitado",
    titulo: ({ equipe }) => [
      ...trechosDaEquipe(equipe),
      { texto: " solicitou encerramento do ticket" },
    ],
  },
  [EventoLog.EncerramentoAprovado]: {
    status: "aprovado",
    titulo: () => [{ texto: "Ticket encerrado, demandas foram concluídas" }],
  },
  [EventoLog.EncerramentoNegado]: {
    status: "recusado",
    titulo: ({ nome }) => [
      { texto: nome, destaque: true },
      { texto: " recusou solicitação de encerramento" },
    ],
  },
  [EventoLog.PrioridadeAlterada]: {
    status: "iniciado",
    titulo: () => [{ texto: "Prioridade do ticket alterada" }],
  },
};

export type LogResposta = Omit<LogTicketComUsuario, "criadoEm"> & {
  criadoEm: Date | string;
};

type UsuarioLog = NonNullable<LogTicketComUsuario["usuario"]>;

function ehEventoAutomatico(evento: string): evento is EventoAutomatico {
  return EVENTOS_AUTOMATICOS.has(evento);
}

export function toAutor(usuario: UsuarioLog): Autor {
  return {
    id: usuario.id,
    nome: usuario.nome,
    equipe: usuario.equipe?.nome ?? "Sem equipe",
    setor: CargoLabel[usuario.cargo] ?? "Não definido",
  };
}

export function toLogItem(log: LogResposta): LogItem {
  const criadoEm = new Date(log.criadoEm);

  if (ehEventoAutomatico(log.evento)) {
    const aviso = AvisoPorEvento[log.evento];
    const tituloTrechos = aviso.titulo({
      equipe: log.usuario?.equipe?.nome ?? "responsável",
      nome: log.usuario?.nome ?? "Usuário removido",
    });

    return {
      id: log.id,
      tipo: "aviso",
      status: aviso.status,
      titulo: tituloTrechos.map((trecho) => trecho.texto).join(""),
      tituloTrechos,
      descricao: log.descricao,
      criadoEm,
    };
  }

  const autor = log.usuario ? toAutor(log.usuario) : null;

  return {
    id: log.id,
    tipo: "manual",
    autorId: autor?.id ?? "",
    autorNome: autor?.nome ?? "Usuário removido",
    equipe: autor?.equipe ?? "Sem equipe",
    setor: autor?.setor ?? "Não definido",
    titulo: log.evento,
    descricao: log.descricao,
    criadoEm,
  };
}
