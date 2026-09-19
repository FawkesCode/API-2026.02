import { prisma } from "@/lib/prisma";
import { Prioridade } from "@/lib/generated/prisma/client";
import type {
  CriarTicketSchema,
  AtualizarPrioridadeTicketSchema,
} from "@/schemas/ticket.schema";

export class ErroConflitoPrioridade extends Error {
  constructor() {
    super("A prioridade do ticket foi alterada por outra requisição enquanto esta era processada.");
    this.name = "ErroConflitoPrioridade";
  }
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

  async listarPorEquipeDoUsuario(usuarioId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
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

  async atualizarPrioridade(ticketId: string, dados: AtualizarPrioridadeTicketSchema) {
    return prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) return null;

      if (ticket.prioridade === dados.prioridade) {
        return ticket;
      }

      const { count } = await tx.ticket.updateMany({
        where: { id: ticketId, prioridade: ticket.prioridade },
        data: { prioridade: dados.prioridade },
      });

      if (count === 0) {
        throw new ErroConflitoPrioridade();
      }

      const atualizado = await tx.ticket.findUniqueOrThrow({ where: { id: ticketId } });

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
}

export const servicoTicket = new ServicoTicket();
