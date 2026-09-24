import { prisma } from "@/lib/prisma";
import {
  Categoria,
  Prioridade,
  Prisma,
  StatusTicket,
} from "@/lib/generated/prisma/client";
import type {
  CriarTicketSchema,
  AtualizarPrioridadeTicketSchema,
} from "@/schemas/ticket.schema";

export class ErroConflitoPrioridade extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroConflitoPrioridade";
  }
}

export interface FiltrosTicket {
  prioridade?: Prioridade;
  status?: StatusTicket;
  titulo?: string;
  data?: string;
  categoria?: Categoria;
  projetoId?: string;
  equipeId?: string;
  localInstalacao?: string;
}

function montarWhere(
  filtros?: FiltrosTicket,
  base: Prisma.TicketWhereInput = {},
): Prisma.TicketWhereInput {
  if (!filtros) return base;

  const where: Prisma.TicketWhereInput = {
    ...base,
  };

  if (filtros.prioridade) {
    where.prioridade = filtros.prioridade;
  }

  if (filtros.status) {
    where.status = filtros.status;
  }

  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }

  if (filtros.titulo) {
    where.titulo = {
      contains: filtros.titulo,
    };
  }

  if (filtros.projetoId) {
    where.projetoId = filtros.projetoId;
  }

  if (filtros.localInstalacao) {
    where.projeto = {
      localInstalacao: {
        contains: filtros.localInstalacao,
      },
    };
  }

  if (filtros.equipeId) {
    where.equipesAlocadas = {
      some: {
        equipeId: filtros.equipeId,
      },
    };
  }

  if (filtros.data) {
    const inicio = new Date(`${filtros.data}T00:00:00.000`);
    const fim = new Date(`${filtros.data}T23:59:59.999`);

    where.criadoEm = {
      gte: inicio,
      lte: fim,
    };
  }

  return where;
}

export class ProjetoNaoEncontradoError extends Error {
  constructor(message = "Projeto não encontrado.") {
    super(message);
    this.name = "ProjetoNaoEncontradoError";
  }
}

export const RELACOES_TICKET = {
  abertoPor: {
    select: {
      id: true,
      nome: true,
    },
  },
  responsavel: {
    select: {
      id: true,
      nome: true,
    },
  },
  projeto: {
    select: {
      id: true,
      nome: true,
    },
  },
  equipesAlocadas: {
    select: {
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
} satisfies Prisma.TicketInclude;

export type TicketComRelacoes = Prisma.TicketGetPayload<{
  include: typeof RELACOES_TICKET;
}>;

const RANKING_PRIORIDADE: Record<Prioridade, number> = {
  [Prioridade.CRITICA]: 0,
  [Prioridade.ALTA]: 1,
  [Prioridade.MEDIA]: 2,
  [Prioridade.BAIXA]: 3,
};

const includeListagem = {
  projeto: {
    select: {
      id: true,
      localInstalacao: true,
    },
  },
  equipesAlocadas: {
    include: {
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
} satisfies Prisma.TicketInclude;

export class ServicoTicket {
  async criar(dados: CriarTicketSchema) {
    const ticket = await prisma.ticket.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        projetoId: dados.projetoId,
        abertoPorId: dados.abertoPorId,
        slaEm: dados.slaEm,

        equipesAlocadas: dados.equipeIds?.length
          ? {
            create: dados.equipeIds.map((equipeId) => ({
              equipeId,
            })),
          }
          : undefined,
      },
      include: RELACOES_TICKET,
    });

    return ticket;
  }

  async listarPorEquipeDoUsuario(usuarioId: string) {
    return prisma.ticket.findMany({
      where: {
        OR: [
          {
            projeto: {
              equipe: {
                usuarios: {
                  some: {
                    id: usuarioId,
                  },
                },
              },
            },
          },
          {
            equipesAlocadas: {
              some: {
                equipe: {
                  usuarios: {
                    some: {
                      id: usuarioId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: RELACOES_TICKET,
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async atualizarPrioridade(
    ticketId: string,
    dados: AtualizarPrioridadeTicketSchema,
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      throw new Error("Ticket não encontrado.");
    }

    return prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        prioridade: dados.prioridade,
      },
      include: RELACOES_TICKET,
    });
  }

  async listarTodos(filtros?: FiltrosTicket) {
    return prisma.ticket.findMany({
      where: montarWhere(filtros),
      orderBy: {
        criadoEm: "desc",
      },
      include: includeListagem,
    });
  }

  async buscarDetalhePorId(ticketId: string) {
    return prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: RELACOES_TICKET,
    });
  }

  async listarPorProjeto(projetoId: string) {
    return prisma.ticket.findMany({
      where: {
        projetoId,
      },
      include: RELACOES_TICKET,
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async alocarEquipe(ticketId: string, equipeId: string) {
    return prisma.ticketEquipe.create({
      data: {
        ticketId,
        equipeId,
      },
      include: {
        equipe: true,
        ticket: true,
      },
    });
  }
}

export const servicoTicket = new ServicoTicket();