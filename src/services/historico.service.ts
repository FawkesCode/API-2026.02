import { prisma } from "@/lib/prisma";
import { Cargo, Prisma, StatusTicket, type PrismaClient } from "@/lib/generated/prisma/client";
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
  equipe: { select: { nome: true } },
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

// Tickets novos já nascem EM_ANDAMENTO, então o início de cada equipe também
// é aceito nesse status (sem mudar o status).
const TRANSICOES: Record<string, { origens: StatusTicket[]; destino: StatusTicket }> = {
  ATIVIDADE_INICIADA: {
    origens: [StatusTicket.NAO_INICIADO, StatusTicket.EM_ANDAMENTO, StatusTicket.EM_REVISAO],
    destino: StatusTicket.EM_ANDAMENTO,
  },
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
      if (ticket.status === StatusTicket.ENCERRADO) {
        throw new TransicaoTicketInvalidaError("Este ticket está encerrado e não recebe novos logs.");
      }
      const decisao = ["ENCERRAMENTO_APROVADO", "ENCERRAMENTO_NEGADO"].includes(dados.evento);
      if ((decisao && usuario.cargo !== Cargo.GESTOR) || dados.evento === "PRIORIDADE_ALTERADA") {
        throw new UsuarioSemAcessoAoTicketError();
      }
      // O início não pode ser desfeito, então checar antes de solicitar não tem corrida.
      if (dados.evento === "ENCERRAMENTO_SOLICITADO") {
        const inicio = await tx.historicoTicket.findFirst({
          where: { ticketId, inicioEquipeId: usuario.equipeId },
          select: { id: true },
        });
        if (!inicio) {
          throw new TransicaoTicketInvalidaError("Sua equipe precisa iniciar os trabalhos antes de solicitar o encerramento.");
        }
      }
      const transicao = Object.hasOwn(TRANSICOES, dados.evento) ? TRANSICOES[dados.evento] : undefined;
      if (transicao && !transicao.origens.includes(ticket.status)) {
        throw new TransicaoTicketInvalidaError("Esta ação não é permitida no status atual do ticket.");
      }
      if (transicao && transicao.destino !== ticket.status) {
        const { count } = await tx.ticket.updateMany({
          where: { id: ticketId, status: ticket.status },
          data: { status: transicao.destino, encerradoEm: transicao.destino === StatusTicket.ENCERRADO ? new Date() : null },
        });
        if (count === 0) {
          throw new TransicaoTicketInvalidaError("O status foi alterado por outro usuário. Atualize a página.");
        }
      }
      const inicio = dados.evento === "ATIVIDADE_INICIADA";
      try {
        return await tx.historicoTicket.create({
          data: {
            ticketId,
            evento: dados.evento,
            descricao: dados.descricao,
            usuarioId: dados.usuarioId,
            equipeId: usuario.equipeId,
            inicioEquipeId: inicio ? usuario.equipeId : null,
          },
          include: incluirUsuario,
        });
      } catch (erro) {
        // uq_historico_inicio_equipe: outro membro da equipe iniciou primeiro,
        // inclusive numa requisição simultânea. A transação desfaz o status.
        if (inicio && erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
          throw new TransicaoTicketInvalidaError("Sua equipe já iniciou os trabalhos neste ticket.");
        }
        throw erro;
      }
    });
  }
}

export const servicoHistoricoTicket = new ServicoHistoricoTicket();