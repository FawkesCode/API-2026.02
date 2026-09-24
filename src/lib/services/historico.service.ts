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

export class UsuarioSemAcessoAoTicketError extends Error {
  constructor() {
    super("Você não tem acesso para registrar logs neste ticket.");
  }
}

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

    const usuario = await prisma.usuario.findUnique({
      where: { id: dados.usuarioId },
      select: { ativo: true, equipeId: true },
    });

    if (!usuario?.ativo || !usuario.equipeId) {
      throw new UsuarioSemAcessoAoTicketError();
    }

    const ticketDaEquipe = await prisma.ticket.count({
      where: {
        id: ticketId,
        OR: [
          { equipesAlocadas: { some: { equipeId: usuario.equipeId } } },
          { projeto: { equipeId: usuario.equipeId } },
        ],
      },
    });

    if (ticketDaEquipe === 0) {
      throw new UsuarioSemAcessoAoTicketError();
    }

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
