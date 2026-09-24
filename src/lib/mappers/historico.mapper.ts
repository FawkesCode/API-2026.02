import type { Cargo } from "@/lib/generated/prisma/client";
import type { LogTicketComUsuario } from "@/lib/services/historico.service";
import type { LogStatus } from "@/components/tickets/log-states";
import type { Autor, LogItem } from "@/components/tickets/ticket-logs";

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
  COMERCIAL: "Comercial",
};

function nomeDaEquipe(equipe: string) {
  return /^equipe\b/i.test(equipe) ? equipe : `Equipe ${equipe}`;
}

const AvisoPorEvento: Record<
  EventoAutomatico,
  { status: LogStatus; titulo: (equipe: string) => string }
> = {
  [EventoLog.AtividadeIniciada]: {
    status: "iniciado",
    titulo: (equipe) => `${nomeDaEquipe(equipe)} começou a trabalhar no ticket`,
  },
  [EventoLog.EncerramentoSolicitado]: {
    status: "solicitado",
    titulo: (equipe) =>
      `${nomeDaEquipe(equipe)} solicitou encerramento do ticket`,
  },
  [EventoLog.EncerramentoAprovado]: {
    status: "aprovado",
    titulo: () => "Solicitação de encerramento aprovada",
  },
  [EventoLog.EncerramentoNegado]: {
    status: "recusado",
    titulo: () => "Solicitação de encerramento negada",
  },
  [EventoLog.PrioridadeAlterada]: {
    status: "iniciado",
    titulo: () => "Prioridade do ticket alterada",
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

    return {
      id: log.id,
      tipo: "aviso",
      status: aviso.status,
      titulo: aviso.titulo(log.usuario?.equipe?.nome ?? "responsável"),
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
