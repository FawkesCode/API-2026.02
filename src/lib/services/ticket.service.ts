import { prisma } from "@/lib/prisma";
import {
  Cargo,
  Categoria,
  Prioridade,
  Prisma,
  PrismaClient,
  StatusTicket,
} from "@/lib/generated/prisma/client";
import type {
  CriarTicketSchema,
  AtualizarPrioridadeComAutor,
} from "@/schemas/ticket.schema";
import { ordenarTicketsPorPrioridade } from "@/lib/services/ticket-order";

export class ErroConflitoPrioridade extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroConflitoPrioridade";
  }
}

// NOTE: se esta classe já existir em outro arquivo de erros do projeto,
// remova esta definição local e importe a existente em vez de duplicá-la.
export class ErroNaoAutorizadoParaAlterarPrioridade extends Error {
  constructor(message = "Usuário não autorizado a alterar a prioridade deste ticket.") {
    super(message);
    this.name = "ErroNaoAutorizadoParaAlterarPrioridade";
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
  abertoPor: {
    select: {
      id: true,
      nome: true,
    },
  },
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
  constructor(private readonly db: PrismaClient = prisma) {}

  async criar(dados: CriarTicketSchema) {
    const equipeIds = [...new Set(dados.equipeIds ?? [])];
    const ticket = await this.db.ticket.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        projetoId: dados.projetoId,
        abertoPorId: dados.abertoPorId,
        slaEm: dados.slaEm,

        equipesAlocadas: equipeIds.length
          ? {
            create: equipeIds.map((equipeId) => ({
              equipeId,
            })),
          }
          : undefined,
      },
      include: RELACOES_TICKET,
    });

    return ticket;
  }

  async buscarTicketsDaEquipeDoUsuario(usuarioId: string) {
    const usuario = await this.db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        ativo: true,
        equipe: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
      },
    });

    if (!usuario?.ativo || !usuario.equipe?.ativo) {
      return { equipe: null, tickets: [] };
    }

    const tickets = await this.db.ticket.findMany({
      // Um ticket pode estar alocado a equipes diferentes da equipe do projeto.
      // A listagem deve considerar a alocação do ticket, não a equipe do projeto.
      where: {
        equipesAlocadas: {
          some: { equipeId: usuario.equipe.id },
        },
      },
      orderBy: { criadoEm: "desc" },
      include: RELACOES_TICKET,
    });

    return {
      equipe: usuario.equipe,
      tickets: ordenarTicketsPorPrioridade(tickets),
    };
  }

  async listarPorEquipeDoUsuario(usuarioId: string) {
    const { tickets } = await this.buscarTicketsDaEquipeDoUsuario(usuarioId);
    return tickets;
  }

  async atualizarPrioridade(
    ticketId: string,
    dados: AtualizarPrioridadeComAutor,
  ) {
    return this.db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { projeto: { select: { equipeId: true } } },
      });
      if (!ticket) return null;

      const gestor = await tx.usuario.findUnique({
        where: { id: dados.usuarioId },
      });
      if (
        !gestor ||
        !gestor.ativo ||
        gestor.cargo !== Cargo.GESTOR ||
        gestor.equipeId !== ticket.projeto.equipeId
      ) {
        throw new ErroNaoAutorizadoParaAlterarPrioridade();
      }

      if (ticket.prioridade === dados.prioridade) {
        return tx.ticket.findUniqueOrThrow({
          where: { id: ticketId },
          include: RELACOES_TICKET,
        });
      }

      const { count } = await tx.ticket.updateMany({
        where: { id: ticketId, prioridade: ticket.prioridade },
        data: { prioridade: dados.prioridade },
      });

      if (count === 0) {
        throw new ErroConflitoPrioridade(
          "A prioridade do ticket foi alterada por outro usuário. Tente novamente.",
        );
      }

      const atualizado = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
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
    return this.db.ticket.findMany({
      where: montarWhere(filtros),
      orderBy: {
        criadoEm: "desc",
      },
      include: includeListagem,
    });
  }

  async buscarDetalhePorId(ticketId: string) {
    return this.db.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: RELACOES_TICKET,
    });
  }

  async listarPorProjeto(projetoId: string) {
    return this.db.ticket.findMany({
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
    const ticket = await this.db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    await this.db.ticketEquipe.upsert({
      where: { ticketId_equipeId: { ticketId, equipeId } },
      create: { ticketId, equipeId },
      update: {},
    });

    return this.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: RELACOES_TICKET,
    });
  }

  async desalocarEquipe(ticketId: string, equipeId: string) {
    const ticket = await this.db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    await this.db.ticketEquipe.deleteMany({
      where: { ticketId, equipeId },
    });

    return this.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: RELACOES_TICKET,
    });
  }
}

export const servicoTicket = new ServicoTicket();
