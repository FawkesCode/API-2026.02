import { prisma } from "@/lib/prisma";
import { Prioridade, StatusTicket, Prisma } from "@/lib/generated/prisma/client";
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
  data?: string; // "yyyy-MM-dd"
}

function montarWhere(
  filtros: FiltrosTicket | undefined,
  base: Prisma.TicketWhereInput = {},
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = { ...base };

  if (filtros?.prioridade) {
    where.prioridade = filtros.prioridade;
  }

  if (filtros?.status) {
    where.status = filtros.status;
  }

  if (filtros?.titulo) {
    where.titulo = { contains: filtros.titulo };
  }

  if (filtros?.data) {
    const inicio = new Date(`${filtros.data}T00:00:00`);
    const fim = new Date(`${filtros.data}T23:59:59.999`);
    where.criadoEm = { gte: inicio, lte: fim };
  }

  return where;
}

export class ServicoTicket {
  async criar(dados: CriarTicketSchema) {
    return prisma.ticket.create({
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
  }

  async atualizarPrioridade(
    ticketId: string,
    dados: AtualizarPrioridadeTicketSchema,
  ) {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) return null;

      if (ticket.prioridade === dados.prioridade) {
        return ticket;
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
        where: { id: ticketId },
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
      orderBy: { criadoEm: "desc" },
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
      where: { id: ticketId },
      include: {
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
            equipe: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });
  }
}

export const servicoTicket = new ServicoTicket();