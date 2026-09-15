import { prisma } from "@/lib/prisma";
import { Prioridade } from "@/lib/generated/prisma/client";
import type {
  CriarTicketSchema,
  AtualizarPrioridadeTicketSchema,
} from "@/schemas/ticket.schema";

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

  async atualizarPrioridade(ticketId: string, dados: AtualizarPrioridadeTicketSchema) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    if (ticket.prioridade === dados.prioridade) {
      return ticket;
    }

    return prisma.$transaction(async (tx) => {
      const atualizado = await tx.ticket.update({
        where: { id: ticketId },
        data: { prioridade: dados.prioridade },
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
}

export const servicoTicket = new ServicoTicket();
