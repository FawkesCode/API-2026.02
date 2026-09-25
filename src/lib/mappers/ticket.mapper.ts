import type { Prisma } from "@/lib/generated/prisma/client";
import {
  TicketPriorityLabel,
  TicketStatusLabel,
  TicketTypeLabel,
  TicketView,
} from "@/types/ticket";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// Ticket "puro" (sem include)
type TicketSemProjeto = Prisma.TicketGetPayload<Record<string, never>>;

// Ticket com o projeto incluído
type TicketComProjeto = Prisma.TicketGetPayload<{
  include: {
    projeto: {
      select: {
        id: true;
      };
    };
  };
}>;

// Ticket com todas as relações utilizadas pelo detalhe
type TicketComRelacoes = Prisma.TicketGetPayload<{
  include: {
    abertoPor: {
      select: {
        id: true;
        nome: true;
      };
    };
    responsavel: {
      select: {
        id: true;
        nome: true;
      };
    };
    projeto: {
      select: {
        id: true;
        nome: true;
      };
    };
    equipesAlocadas: {
      select: {
        equipe: {
          select: {
            id: true;
            nome: true;
          };
        };
      };
    };
  };
}>;

export type TicketRes = TicketSemProjeto | TicketComProjeto | TicketComRelacoes;

function extrairProjectId(info: TicketRes): string | undefined {
  if ("projeto" in info && info.projeto) {
    return info.projeto.id;
  }

  return undefined;
}

export function toTicketDTO(info: TicketRes): TicketView {
  const ticketComRelacoes = "abertoPor" in info && "equipesAlocadas" in info;

  const teamsArray = [];
  if (ticketComRelacoes)
    for (const [key, equipes] of Object.entries(info.equipesAlocadas)) {
      teamsArray.push({ id: equipes.equipe.id, nome: equipes.equipe.nome });
    }

  return {
    id: info.id,
    title: info.titulo,

    type:
      TicketTypeLabel[info.categoria as keyof typeof TicketTypeLabel] ===
      "Instalação"
        ? ""
        : (TicketTypeLabel[info.categoria as keyof typeof TicketTypeLabel] ??
          "Não definido"),

    openedAt: format(new Date(info.criadoEm), "d/M"),

    timeRemaining: info.slaEm
      ? formatDistanceToNow(new Date(info.slaEm), {
          addSuffix: false,
          locale: ptBR,
        })
      : "Sem prazo definido",

    createdBy: ticketComRelacoes
      ? (info.abertoPor?.nome ?? "Não definido")
      : "Esperando correção",

    createdById: ticketComRelacoes ? info.abertoPorId : "",

    teams: ticketComRelacoes ? teamsArray : [],

    status:
      TicketStatusLabel[info.status as keyof typeof TicketStatusLabel] ??
      "Não definido",

    priority:
      TicketPriorityLabel[
        info.prioridade as keyof typeof TicketPriorityLabel
      ] ?? "Não definido",

    description: info.descricao,
    recentLogs: [],
    projectId: extrairProjectId(info),
  };
}
