import { prisma } from "@/lib/prisma";
import { Cargo, StatusTicket, type Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
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

export class TransicaoTicketInvalidaError extends Error {}

const TRANSICOES: Record<string, { origens: StatusTicket[]; destino: StatusTicket }> = {
  ATIVIDADE_INICIADA: { origens: [StatusTicket.NAO_INICIADO, StatusTicket.EM_REVISAO], destino: StatusTicket.EM_ANDAMENTO },
  ENCERRAMENTO_SOLICITADO: { origens: [StatusTicket.EM_ANDAMENTO, StatusTicket.EM_REVISAO], destino: StatusTicket.SOLICITACAO_ENCERRAMENTO },
  ENCERRAMENTO_APROVADO: { origens: [StatusTicket.SOLICITACAO_ENCERRAMENTO], destino: StatusTicket.ENCERRADO },
  ENCERRAMENTO_NEGADO: { origens: [StatusTicket.SOLICITACAO_ENCERRAMENTO], destino: StatusTicket.EM_REVISAO },
};

export class ServicoHistoricoTicket {
  constructor(private readonly db: PrismaClient = prisma) {}
  async listarPorTicket(ticketId: string) {
    const ticket = await this.db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return null;

    return this.db.historicoTicket.findMany({
      where: { ticketId },
      // Ordem cronológica (mais antigo em cima, mais novo embaixo), como em um chat.
      orderBy: { criadoEm: "asc" },
      include: incluirUsuario,
    });
  }

  async criar(ticketId: string, dados: CriarLogTicketSchema) {
    return this.db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { equipesAlocadas: { select: { equipeId: true } } },
      });
      if (!ticket) return null;

      const usuario = await tx.usuario.findUnique({
        where: { id: dados.usuarioId },
        select: { ativo: true, equipeId: true, cargo: true },
      });
      if (!usuario?.ativo || !usuario.equipeId ||
          !ticket.equipesAlocadas.some((alocacao) => alocacao.equipeId === usuario.equipeId)) {
        throw new UsuarioSemAcessoAoTicketError();
      }
      const decisao = ["ENCERRAMENTO_APROVADO", "ENCERRAMENTO_NEGADO"].includes(dados.evento);
      if ((decisao && usuario.cargo !== Cargo.GESTOR) || dados.evento === "PRIORIDADE_ALTERADA") {
        throw new UsuarioSemAcessoAoTicketError();
      }
      const transicao = Object.hasOwn(TRANSICOES, dados.evento) ? TRANSICOES[dados.evento] : undefined;
      if (transicao) {
        if (!transicao.origens.includes(ticket.status)) {
          throw new TransicaoTicketInvalidaError("Esta ação não é permitida no status atual do ticket.");
        }
        const { count } = await tx.ticket.updateMany({
          where: { id: ticketId, status: ticket.status },
          data: { status: transicao.destino, encerradoEm: transicao.destino === StatusTicket.ENCERRADO ? new Date() : null },
        });
        if (count === 0) {
          throw new TransicaoTicketInvalidaError("O status foi alterado por outro usuário. Atualize a página.");
        }
      }
      return tx.historicoTicket.create({
        data: { ticketId, evento: dados.evento, descricao: dados.descricao, usuarioId: dados.usuarioId },
        include: incluirUsuario,
      });
    });
  }
}

export const servicoHistoricoTicket = new ServicoHistoricoTicket();