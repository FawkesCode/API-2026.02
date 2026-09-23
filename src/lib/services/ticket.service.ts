import { prisma } from "@/lib/prisma";
import { Cargo, Prioridade } from "@/lib/generated/prisma/client";
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

export class ErroNaoAutorizadoParaAlterarPrioridade extends Error {
  constructor() {
    super("Apenas gestores da equipe responsável pelo ticket podem alterar sua prioridade.");
    this.name = "ErroNaoAutorizadoParaAlterarPrioridade";
  }
}

export class ServicoTicket {
  constructor(private readonly banco = prisma) {}

  async criar(dados: CriarTicketSchema) {
    return this.banco.ticket.create({
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

  async atualizarPrioridade(ticketId: string, dados: AtualizarPrioridadeTicketSchema) {
    return this.banco.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { projeto: { select: { equipeId: true } } },
      });
      if (!ticket) return null;

      const gestor = await tx.usuario.findUnique({ where: { id: dados.usuarioId } });
      if (
        !gestor ||
        !gestor.ativo ||
        gestor.cargo !== Cargo.GESTOR ||
        gestor.equipeId !== ticket.projeto.equipeId
      ) {
        throw new ErroNaoAutorizadoParaAlterarPrioridade();
      }

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

    async buscarDetalhePorId(ticketId: string) {
    return prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        abertoPor: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, nome: true } },
        projeto: {
          select: {
            id: true,
            nome: true,
            equipe: { select: { id: true, nome: true } },
          },
        },
      },
    });
  }
  
}

export const servicoTicket = new ServicoTicket();
