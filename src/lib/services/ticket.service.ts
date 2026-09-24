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
  constructor() {
    super(
      "A prioridade do ticket foi alterada por outra requisição enquanto esta era processada.",
    );
    this.name = "ErroConflitoPrioridade";
  }
}

export interface FiltrosTicket {
  prioridade?: Prioridade;
  status?: StatusTicket;
  titulo?: string;
  data?: string;
}

function montarWhere(
  filtros: FiltrosTicket | undefined,
  base: Prisma.TicketWhereInput = {},
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {
    ...base,
  };

  if (filtros?.prioridade) {
    where.prioridade = filtros.prioridade;
  }

  if (filtros?.status) {
    where.status = filtros.status;
  }

  if (filtros?.titulo) {
    where.titulo = {
      contains: filtros.titulo,
    };
  }

  if (filtros?.data) {
    const inicio = new Date(`${filtros.data}T00:00:00`);
    const fim = new Date(`${filtros.data}T23:59:59.999`);

    where.criadoEm = {
      gte: inicio,
      lte: fim,
    };
  }

  return where;
}

export class ProjetoNaoEncontradoError extends Error {
  constructor() {
    super("projetoId não corresponde a nenhum projeto existente.");
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

export class ServicoTicket {
  async criar(dados: CriarTicketSchema) {
    return prisma.$transaction(async (tx) => {
      const projeto = await tx.projeto.findUnique({
        where: {
          id: dados.projetoId,
        },
      });

      if (!projeto) {
        throw new ProjetoNaoEncontradoError();
      }

      const ticket = await tx.ticket.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          prioridade: dados.prioridade ?? Prioridade.MEDIA,
          slaEm: dados.slaEm,
          projetoId: dados.projetoId,
          abertoPorId: dados.abertoPorId,
          responsavelId: dados.responsavelId,
        },
      });

      await tx.ticketEquipe.create({
        data: {
          ticketId: ticket.id,
          equipeId: projeto.equipeId,
        },
      });

      return tx.ticket.findUniqueOrThrow({
        where: {
          id: ticket.id,
        },
        include: RELACOES_TICKET,
      });
    });
  }

  async listarPorEquipeDoUsuario(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
      select: {
        equipeId: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo || !usuario.equipeId) {
      return [];
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        projeto: {
          equipeId: usuario.equipeId,
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        projeto: {
          select: {
            id: true,
            nome: true,
            equipeId: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    return tickets;
  }

  async atualizarPrioridade(
    ticketId: string,
    dados: AtualizarPrioridadeTicketSchema,
  ) {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: {
          id: ticketId,
        },
      });

      if (!ticket) {
        return null;
      }

      if (ticket.prioridade === dados.prioridade) {
        return tx.ticket.findUniqueOrThrow({
          where: {
            id: ticketId,
          },
          include: RELACOES_TICKET,
        });
      }

      const { count } = await tx.ticket.updateMany({
        where: {
          id: ticketId,
          prioridade: ticket.prioridade,
        },
        data: {
          prioridade: dados.prioridade,
        },
      });

      if (count === 0) {
        throw new ErroConflitoPrioridade();
      }

      const atualizado = await tx.ticket.findUniqueOrThrow({
        where: {
          id: ticketId,
        },
        include: RELACOES_TICKET,
      });

      await tx.historicoTicket.create({
        data: {
          ticketId,
          evento: "PRIORIDADE_ALTERADA",
          descricao: `Prioridade alterada de ${ticket.prioridade} para ${dados.prioridade}.`,
          usuarioId: dados.usuarioId,
        },
      });

      return atualizado;
    });
  }

  async listarTodos(filtros?: FiltrosTicket) {
    return prisma.ticket.findMany({
      where: montarWhere(filtros),
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        projeto: {
          select: {
            id: true,
          },
        },
      },
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
    const tickets = await prisma.ticket.findMany({
      where: {
        projetoId,
      },
      include: RELACOES_TICKET,
    });

    return [...tickets].sort((a, b) => {
      if (a.categoria !== b.categoria) {
        if (a.categoria === Categoria.INSTALACAO) return -1;
        if (b.categoria === Categoria.INSTALACAO) return 1;
      }

      const diferencaPrioridade =
        RANKING_PRIORIDADE[a.prioridade] -
        RANKING_PRIORIDADE[b.prioridade];

      if (diferencaPrioridade !== 0) {
        return diferencaPrioridade;
      }

      return a.criadoEm.getTime() - b.criadoEm.getTime();
    });
  }

  async alocarEquipe(ticketId: string, equipeId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return null;
    }

    await prisma.ticketEquipe.upsert({
      where: {
        ticketId_equipeId: {
          ticketId,
          equipeId,
        },
      },
      create: {
        ticketId,
        equipeId,
      },
      update: {},
    });

    return prisma.ticket.findUniqueOrThrow({
      where: {
        id: ticketId,
      },
      include: RELACOES_TICKET,
    });
  }
}

export const servicoTicket = new ServicoTicket();