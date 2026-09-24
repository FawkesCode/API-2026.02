import { prisma } from "@/lib/prisma";
import {
  Categoria,
  Prioridade,
  StatusTicket,
  Prisma,
} from "@/lib/generated/prisma/client";
import type { CriarProjetoSchema } from "@/schemas/projeto.schema";
import { RELACOES_TICKET } from "@/lib/services/ticket.service";

const DIAS_SLA_INSTALACAO_PADRAO = 7;

function calcularSlaPadrao() {
  const sla = new Date();
  sla.setDate(sla.getDate() + DIAS_SLA_INSTALACAO_PADRAO);
  return sla;
}

export class GestorNaoEncontradoError extends Error {
  constructor() {
    super("Gestor não encontrado.");
  }
}

export class GestorSemEquipeError extends Error {
  constructor() {
    super(
      "O gestor selecionado não está vinculado a nenhuma equipe no momento. " +
        "Associe o gestor a uma equipe antes de criar o projeto.",
    );
  }
}

const RANKING_PRIORIDADE: Record<Prioridade, number> = {
  [Prioridade.CRITICA]: 0,
  [Prioridade.ALTA]: 1,
  [Prioridade.MEDIA]: 2,
  [Prioridade.BAIXA]: 3,
};

export class ServicoProjeto {
  async criarComTicketDeInstalacao(dados: CriarProjetoSchema) {
    return prisma.$transaction(async (tx) => {
      const gestor = await tx.usuario.findUnique({
        where: { id: dados.gestorId },
      });

      if (!gestor) {
        throw new GestorNaoEncontradoError();
      }

      if (!gestor.equipeId) {
        throw new GestorSemEquipeError();
      }

      const projeto = await tx.projeto.create({
        data: {
          nome: dados.nome,
          localInstalacao: dados.localInstalacao,
          descricao: dados.descricao ?? null,
          clienteId: dados.clienteId,
          equipeId: gestor.equipeId,
          gestorId: dados.gestorId,
        },
      });

      const ticketInstalacao = await tx.ticket.create({
        data: {
          titulo: `Instalação — ${dados.nome}`,
          descricao:
            dados.descricao?.trim() ||
            `Ticket de instalação gerado automaticamente para o projeto "${dados.nome}" (local: ${dados.localInstalacao}).`,
          categoria: Categoria.INSTALACAO,
          prioridade: Prioridade.MEDIA,
          status: StatusTicket.NAO_INICIADO,
          slaEm: calcularSlaPadrao(),
          projetoId: projeto.id,
          abertoPorId: dados.gestorId,
        },
      });

      await tx.ticketEquipe.create({
        data: {
          ticketId: ticketInstalacao.id,
          equipeId: gestor.equipeId,
        },
      });

      const ticketInstalacaoComRelacoes =
        await tx.ticket.findUniqueOrThrow({
          where: { id: ticketInstalacao.id },
          include: RELACOES_TICKET,
        });

      return {
        projeto,
        ticketInstalacao: ticketInstalacaoComRelacoes,
      };
    });
  }

  async buscarProjetoComTicketDeInstalacao(projetoId: string) {
    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
    });

    if (!projeto) {
      return {
        projeto: null,
        ticketInstalacao: null,
      };
    }

    const ticketInstalacao = await prisma.ticket.findFirst({
      where: {
        projetoId,
        categoria: Categoria.INSTALACAO,
      },
      orderBy: {
        criadoEm: "asc",
      },
      include: RELACOES_TICKET,
    });

    return {
      projeto,
      ticketInstalacao,
    };
  }

  async buscarDetalhePorId(projetoId: string) {
    return prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        gestor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos os tickets de um projeto, permitindo filtros.
   */
  async listarTicketsDoProjeto(
    projetoId: string,
    filtros?: {
      prioridade?: Prioridade;
      status?: StatusTicket;
      titulo?: string;
      data?: string;
    },
  ) {
    const where: Prisma.TicketWhereInput = {
      projetoId,
    };

    if (filtros?.prioridade) {
      where.prioridade = filtros.prioridade;
    }

    if (filtros?.status) {
      where.status = filtros.status;
    }

    if (filtros?.titulo) {
      where.titulo = {
        contains: filtros.titulo,
      };
    }

    if (filtros?.data) {
      const inicio = new Date(`${filtros.data}T00:00:00`);
      const fim = new Date(`${filtros.data}T23:59:59.999`);

      where.criadoEm = {
        gte: inicio,
        lte: fim,
      };
    }

    return prisma.ticket.findMany({
      where,
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async listarAtivos() {
    return prisma.projeto.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        gestor: {
          select: {
            id: true,
            nome: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });
  }

  async listarTicketsPorProjeto(projetoId: string) {
    const tickets = await prisma.ticket.findMany({
      where: {
        projetoId,
      },
    });

    return [...tickets].sort((a, b) => {
      if (a.categoria !== b.categoria) {
        if (a.categoria === Categoria.INSTALACAO) return -1;
        if (b.categoria === Categoria.INSTALACAO) return 1;
      }

      const diferencaPrioridade =
        RANKING_PRIORIDADE[a.prioridade] -
        RANKING_PRIORIDADE[b.prioridade];

      if (diferencaPrioridade !== 0) {
        return diferencaPrioridade;
      }

      return a.criadoEm.getTime() - b.criadoEm.getTime();
    });
  }
}

export const servicoProjeto = new ServicoProjeto();