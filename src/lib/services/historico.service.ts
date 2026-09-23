import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { CriarLogTicketSchema } from "@/schemas/historico.schema";

const incluirUsuario = {
  usuario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      equipe: { select: { nome: true } },
    },
  },
} satisfies Prisma.HistoricoTicketInclude;

export type LogTicketComUsuario = Prisma.HistoricoTicketGetPayload<{
  include: typeof incluirUsuario;
}>;

export class ServicoHistoricoTicket {
  async listarPorTicket(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    return prisma.historicoTicket.findMany({
      where: { ticketId },
      orderBy: { criadoEm: "desc" },
      include: incluirUsuario,
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
      include: incluirUsuario,
    });
  }
}

export const servicoHistoricoTicket = new ServicoHistoricoTicket();
