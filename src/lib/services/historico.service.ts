import { prisma } from "@/lib/prisma";
import type { CriarLogTicketSchema } from "@/schemas/historico.schema";

export class ServicoHistoricoTicket {
  async listarPorTicket(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    return prisma.historicoTicket.findMany({
      where: { ticketId },
      orderBy: { criadoEm: "desc" },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    });
  }

  async criar(ticketId: string, dados: CriarLogTicketSchema) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    return prisma.historicoTicket.create({
      data: {
        ticketId,
        evento: dados.evento,
        descricao: dados.descricao,
        usuarioId: dados.usuarioId,
      },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    });
  }
}

export const servicoHistoricoTicket = new ServicoHistoricoTicket();
