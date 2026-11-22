import { prisma } from "@/lib/prisma";
import EmailManagerService from "./email.service";
import { travarStatusDoTicket } from "./ticket-trava";
import {
  Cargo,
  Categoria,
  Prioridade,
  Prisma,
  PrismaClient,
  StatusTicket,
} from "@/lib/generated/prisma/client";
import type {
  CriarTicketSchema,
  AtualizarPrioridadeComAutor,
} from "@/schemas/ticket.schema";
import { ordenarTicketsPorPrioridade } from "@/services/ticket-order";
import { normalizedPagination } from "@/lib/pagination";

export class ErroConflitoPrioridade extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroConflitoPrioridade";
  }
}

export class ErroRelatorioEquipeInvalido extends Error {
  constructor() {
    super("Informe a razão do acionamento da equipe.");
    this.name = "ErroRelatorioEquipeInvalido";
  }
}

export const TAMANHO_PAGINA_TICKETS = 5;

export type StatusNotificacaoEquipe =
  | "PENDENTE"
  | "ENVIADO"
  | "FALHOU"
  | "SEM_GESTOR"
  | "NAO_NECESSARIA";

// NOTE: se esta classe já existir em outro arquivo de erros do projeto,
// remova esta definição local e importe a existente em vez de duplicá-la.
export class ErroNaoAutorizadoParaAlterarPrioridade extends Error {
  constructor(
    message = "Usuário não autorizado a alterar a prioridade deste ticket.",
  ) {
    super(message);
    this.name = "ErroNaoAutorizadoParaAlterarPrioridade";
  }
}

export interface FiltrosTicket {
  prioridade?: Prioridade;
  status?: StatusTicket;
  titulo?: string;
  data?: string;
  categoria?: Categoria;
  projetoId?: string;
  equipeId?: string;
  localInstalacao?: string;
  pagina: number;
  itensPorPagina: number;
}

function montarWhere(
  filtros?: FiltrosTicket,
  base: Prisma.TicketWhereInput = {},
): Prisma.TicketWhereInput {
  if (!filtros) return base;

  const where: Prisma.TicketWhereInput = {
    ...base,
  };

  if (filtros.prioridade) {
    where.prioridade = filtros.prioridade;
  }

  if (filtros.status) {
    where.status = filtros.status;
  }

  if (filtros.categoria) {
    where.categoria = filtros.categoria;
  }

  if (filtros.titulo) {
    where.titulo = {
      contains: filtros.titulo,
    };
  }

  if (filtros.projetoId) {
    where.projetoId = filtros.projetoId;
  }

  if (filtros.localInstalacao) {
    where.projeto = {
      localInstalacao: {
        contains: filtros.localInstalacao,
      },
    };
  }

  if (filtros.equipeId) {
    where.equipesAlocadas = {
      some: {
        equipeId: filtros.equipeId,
      },
    };
  }

  if (filtros.data) {
    const inicio = new Date(`${filtros.data}T00:00:00.000`);
    const fim = new Date(`${filtros.data}T23:59:59.999`);

    where.criadoEm = {
      gte: inicio,
      lte: fim,
    };
  }

  return where;
}

export class ProjetoNaoEncontradoError extends Error {
  constructor(message = "Projeto não encontrado.") {
    super(message);
    this.name = "ProjetoNaoEncontradoError";
  }
}

export const RELACOES_TICKET = {
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
    },
  },
  equipesAlocadas: {
    select: {
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
  historico: {
    orderBy: { criadoEm: "desc" },
    take: 2,
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          equipe: { select: { nome: true } },
        },
      },
    },
  },
} satisfies Prisma.TicketInclude;

export type TicketComRelacoes = Prisma.TicketGetPayload<{
  include: typeof RELACOES_TICKET;
}>;

const RANKING_PRIORIDADE: Record<Prioridade, number> = {
  [Prioridade.CRITICA]: 0,
  [Prioridade.ALTA]: 1,
  [Prioridade.MEDIA]: 2,
  [Prioridade.BAIXA]: 3,
};

const includeListagem = {
  abertoPor: {
    select: {
      id: true,
      nome: true,
    },
  },
  projeto: {
    select: {
      id: true,
      localInstalacao: true,
    },
  },
  equipesAlocadas: {
    include: {
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
  historico: {
    orderBy: { criadoEm: "desc" },
    take: 2,
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          cargo: true,
          equipe: { select: { nome: true } },
        },
      },
    },
  },
} satisfies Prisma.TicketInclude;

async function exigirGestorDoTicket(
  tx: Prisma.TransactionClient,
  equipesDoTicket: { equipeId: string }[],
  usuarioId: string,
) {
  const gestor = await tx.usuario.findUnique({ where: { id: usuarioId } });
  if (
    !gestor?.ativo ||
    gestor.cargo !== Cargo.GESTOR ||
    !gestor.equipeId ||
    !equipesDoTicket.some((e) => e.equipeId === gestor.equipeId)
  ) {
    throw new ErroNaoAutorizadoParaGerenciarEquipes();
  }
}

export class ServicoTicket {
  constructor(private readonly db: PrismaClient = prisma) {}

  async criar(dados: CriarTicketSchema) {
    const equipeIds = [...new Set(dados.equipeIds ?? [])];
    return this.db.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          categoria: dados.categoria,
          prioridade: dados.prioridade,
          status: StatusTicket.EM_ANDAMENTO,
          projetoId: dados.projetoId,
          abertoPorId: dados.abertoPorId,
          slaEm: dados.slaEm,
          equipesAlocadas: equipeIds.length
            ? {
                create: equipeIds.map((equipeId) => ({ equipeId })),
              }
            : undefined,
        },
        select: { id: true, titulo: true },
      });
      const projeto = await tx.projeto.findUnique({
        where: { id: dados.projetoId },
        select: { nome: true },
      });
      await tx.atividadeConta.create({
        data: {
          usuarioId: dados.abertoPorId,
          tipo: "TICKET | ABERTURA",
          descricao: `Abriu o ticket ${ticket.titulo} vinculado ao projeto ${projeto?.nome ?? "desconhecido"}.`,
        },
      });
      return tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: RELACOES_TICKET,
      });
    });
  }

  async buscarTicketsDaEquipeDoUsuario(
    usuarioId: string,
    filtros?: Pick<FiltrosTicket, "pagina" | "itensPorPagina">,
  ) {
    const { pagina: paginaPedida, itensPorPagina } = normalizedPagination(
      filtros?.pagina,
      filtros?.itensPorPagina,
    );

    const usuario = await this.db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        ativo: true,
        equipe: {
          select: {
            id: true,
            nome: true,
            ativo: true,
          },
        },
      },
    });

    if (!usuario?.ativo || !usuario.equipe?.ativo) {
      return {
        equipe: null,
        itens: [],
        total: 0,
        pagina: 1,
        totalPaginas: 1,
        itensPorPagina,
      };
    }

    const where: Prisma.TicketWhereInput = {
      equipesAlocadas: {
        some: {
          equipeId: usuario.equipe.id,
        },
      },
    };

    const total = await this.db.ticket.count({ where });

    const totalPaginas = Math.max(1, Math.ceil(total / itensPorPagina));

    const pagina = Math.min(paginaPedida, totalPaginas);

    const itens = await this.db.ticket.findMany({
      where,
      include: includeListagem,
      orderBy: [{ criadoEm: "desc" }],
      skip: (pagina - 1) * itensPorPagina,
      take: Number(itensPorPagina),
    });

    return {
      equipe: usuario.equipe,
      itens,
      total,
      pagina,
      totalPaginas,
      itensPorPagina,
    };
  }

  async listarPorEquipeDoUsuario(usuarioId: string) {
    const { itens } = await this.buscarTicketsDaEquipeDoUsuario(usuarioId);
    return itens;
  }

  async atualizarPrioridade(
    ticketId: string,
    dados: AtualizarPrioridadeComAutor,
  ) {
    return this.db.$transaction(async (tx) => {
      // Trava a linha: o status lido abaixo não muda até o commit.
      await travarStatusDoTicket(tx, ticketId);
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { equipesAlocadas: { select: { equipeId: true } } },
      });
      if (!ticket) return null;

      const gestor = await tx.usuario.findUnique({
        where: { id: dados.usuarioId },
      });
      if (
        !gestor ||
        !gestor.ativo ||
        gestor.cargo !== Cargo.GESTOR ||
        !gestor.equipeId ||
        !ticket.equipesAlocadas.some(
          (alocacao) => alocacao.equipeId === gestor.equipeId,
        )
      ) {
        throw new ErroNaoAutorizadoParaAlterarPrioridade();
      }

      if (ticket.status === StatusTicket.ENCERRADO) {
        throw new ErroTicketEncerrado(
          "Este ticket está encerrado e sua prioridade não pode ser alterada.",
        );
      }

      if (ticket.prioridade === dados.prioridade) {
        return tx.ticket.findUniqueOrThrow({
          where: { id: ticketId },
          include: RELACOES_TICKET,
        });
      }

      const { count } = await tx.ticket.updateMany({
        where: { id: ticketId, prioridade: ticket.prioridade },
        data: { prioridade: dados.prioridade },
      });

      if (count === 0) {
        throw new ErroConflitoPrioridade(
          "A prioridade do ticket foi alterada por outro usuário. Tente novamente.",
        );
      }

      const atualizado = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        include: RELACOES_TICKET,
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
    const where: Prisma.TicketWhereInput = montarWhere(filtros);

    const { pagina: paginaPedida, itensPorPagina } = normalizedPagination(
      filtros?.pagina,
      filtros?.itensPorPagina,
    );

    const total = await prisma.ticket.count({ where });

    const totalPaginas = Math.max(1, Math.ceil(total / itensPorPagina));

    const pagina = Math.min(paginaPedida, totalPaginas);

    const itens = await prisma.ticket.findMany({
      where,
      include: includeListagem,
      orderBy: [{ criadoEm: "desc" }],
      skip: (pagina - 1) * itensPorPagina,
      take: Number(itensPorPagina),
    });

    return { itens, total, pagina, totalPaginas, itensPorPagina };
  }

  async buscarDetalhePorId(ticketId: string) {
    return this.db.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: RELACOES_TICKET,
    });
  }

  async listarPorProjeto(projetoId: string) {
    return this.db.ticket.findMany({
      where: {
        projetoId,
      },
      include: RELACOES_TICKET,
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async alocarEquipe(ticketId: string, equipeId: string, usuarioId?: string) {
    const alocado = await this.db.$transaction(async (tx) => {
      const status = await travarStatusDoTicket(tx, ticketId);
      if (!status) return false;
      if (status === StatusTicket.ENCERRADO) throw new ErroTicketEncerrado();

      const ticket = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        select: { titulo: true },
      });
      await tx.ticketEquipe.upsert({
        where: { ticketId_equipeId: { ticketId, equipeId } },
        create: { ticketId, equipeId },
        update: {},
      });
      if (usuarioId) {
        const equipe = await tx.equipe.findUnique({
          where: { id: equipeId },
          select: { nome: true },
        });
        await tx.atividadeConta.create({
          data: {
            usuarioId,
            tipo: "TICKET",
            descricao: `Atribuiu equipe ${equipe?.nome ?? "equipe"} ao ticket ${ticket.titulo}.`,
          },
        });
      }
      return true;
    });
    if (!alocado) return null;

    await this.notificarGestorDaEquipe(ticketId, equipeId);

    return this.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: RELACOES_TICKET,
    });
  }

  async desalocarEquipe(
    ticketId: string,
    equipeId: string,
    usuarioId?: string,
  ) {
    const desalocado = await this.db.$transaction(async (tx) => {
      const status = await travarStatusDoTicket(tx, ticketId);
      if (!status) return false;
      if (status === StatusTicket.ENCERRADO) throw new ErroTicketEncerrado();

      const ticket = await tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        select: { titulo: true },
      });
      const { count } = await tx.ticketEquipe.deleteMany({
        where: { ticketId, equipeId },
      });
      if (usuarioId && count > 0) {
        const equipe = await tx.equipe.findUnique({
          where: { id: equipeId },
          select: { nome: true },
        });
        await tx.atividadeConta.create({
          data: {
            usuarioId,
            tipo: "TICKET",
            descricao: `Desatribuiu equipe ${equipe?.nome ?? "equipe"} do ticket ${ticket.titulo}.`,
          },
        });
      }
      return true;
    });
    if (!desalocado) return null;

    return this.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: RELACOES_TICKET,
    });
  }

  async atribuirEquipe(
    ticketId: string,
    equipeId: string,
    usuarioId: string,
    relatorio?: string,
  ) {
    let resultado:
      | { jaAlocada: true; relatorio?: string }
      | { jaAlocada: false; relatorio: string }
      | null;
    try {
      resultado = await this.db.$transaction(async (tx) => {
        // Serializa as atribuições do mesmo ticket. A UNIQUE abaixo continua
        // sendo a última proteção contra duplicidade em concorrência.
        await travarStatusDoTicket(tx, ticketId);
        const ticket = await tx.ticket.findUnique({
          where: { id: ticketId },
          include: { equipesAlocadas: { select: { equipeId: true } } },
        });
        if (!ticket) return null;

        await exigirGestorDoTicket(tx, ticket.equipesAlocadas, usuarioId);
        if (ticket.status === StatusTicket.ENCERRADO)
          throw new ErroTicketEncerrado();

        const relatorioEfetivo = relatorio?.trim() || ticket.descricao?.trim();
        if (!relatorioEfetivo) throw new ErroRelatorioEquipeInvalido();

        const equipe = await tx.equipe.findUnique({
          where: { id: equipeId },
          select: { ativo: true, nome: true },
        });
        if (!equipe?.ativo) {
          throw new ErroEquipeInvalida("Equipe não encontrada ou inativa.");
        }

        const jaAlocada = ticket.equipesAlocadas.some(
          (e) => e.equipeId === equipeId,
        );
        if (jaAlocada) return { jaAlocada: true };

        await tx.ticketEquipe.create({ data: { ticketId, equipeId } });
        await tx.atividadeConta.create({
          data: {
            usuarioId,
            tipo: "TICKET",
            descricao: `Atribuiu equipe ${equipe.nome} ao ticket ${ticket.titulo}.`,
          },
        });

        return { jaAlocada: false, relatorio: relatorioEfetivo };
      });
    } catch (erro) {
      // Se duas requisições simultâneas passarem pela leitura inicial, a
      // restrição UNIQUE pode rejeitar uma delas. Converte esse caso em
      // duplicidade normal, sem tentar enviar um segundo e-mail.
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002"
      ) {
        const associacaoExistente = await this.db.ticketEquipe.findUnique({
          where: { ticketId_equipeId: { ticketId, equipeId } },
          select: { id: true },
        });
        if (associacaoExistente) resultado = { jaAlocada: true };
        else throw erro;
      } else {
        throw erro;
      }
    }

    if (!resultado) return null;

    // Se já estava no ticket, não recria nem reenvia e-mail.
    if (resultado.jaAlocada) {
      return {
        jaAlocada: true as const,
        ticket: await this.db.ticket.findUniqueOrThrow({
          where: { id: ticketId },
          include: RELACOES_TICKET,
        }),
        notificacaoEmail: "NAO_NECESSARIA" as const,
        notificarEmail: false as const,
      };
    }

    const ticket = await this.db.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: RELACOES_TICKET,
    });
    return {
      jaAlocada: false as const,
      ticket,
      relatorio: resultado.relatorio,
      notificacaoEmail: "PENDENTE" as const,
      notificarEmail: true as const,
    };
  }

  async notificarGestorDaEquipe(
    ticketId: string,
    equipeId: string,
    relatorio?: string,
  ): Promise<StatusNotificacaoEquipe> {
    try {
      const membros = await this.db.usuario.findMany({
        where: { equipeId, ativo: true },
        select: { nome: true, email: true },
      });

      if (membros.length === 0) {
        console.warn(
          `Nenhum membro ativo encontrado para a equipe ${equipeId}. O e-mail não foi enviado.`,
        );
        return "SEM_GESTOR";
      }

      const ticket = await this.db.ticket.findUnique({
        where: { id: ticketId },
        select: { descricao: true },
      });
      if (!ticket) return "FALHOU";

      const resultado = await new EmailManagerService({
        destinatarios: membros,
        ticketId,
        relatorio: relatorio?.trim() || ticket.descricao,
      }).sendMail();
      if (!resultado?.success) {
        console.error(
          "Falha ao enviar e-mail de atribuição de equipe:",
          resultado?.error,
        );
        return "FALHOU";
      }
      return "ENVIADO";
    } catch (erro) {
      console.error("Falha ao notificar o gestor da equipe:", erro);
      return "FALHOU";
    }
  }

  async desatribuirEquipe(
    ticketId: string,
    equipeId: string,
    usuarioId: string,
  ) {
    return this.db.$transaction(async (tx) => {
      // Trava a linha: o status lido abaixo não muda até o commit.
      await travarStatusDoTicket(tx, ticketId);
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { equipesAlocadas: { select: { equipeId: true } } },
      });
      if (!ticket) return null;

      await exigirGestorDoTicket(tx, ticket.equipesAlocadas, usuarioId);
      if (ticket.status === StatusTicket.ENCERRADO)
        throw new ErroTicketEncerrado();

      if (!ticket.equipesAlocadas.some((e) => e.equipeId === equipeId)) {
        throw new ErroEquipeInvalida(
          "Esta equipe não está atribuída ao ticket.",
        );
      }
      if (ticket.equipesAlocadas.length <= 1) {
        throw new ErroUltimaEquipeDoTicket();
      }

      const equipe = await tx.equipe.findUnique({
        where: { id: equipeId },
        select: { nome: true },
      });
      await tx.ticketEquipe.deleteMany({ where: { ticketId, equipeId } });
      await tx.atividadeConta.create({
        data: {
          usuarioId,
          tipo: "TICKET",
          descricao: `Desatribuiu equipe ${equipe?.nome ?? "equipe"} do ticket ${ticket.titulo}.`,
        },
      });

      return tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        include: RELACOES_TICKET,
      });
    });
  }
}

export class ErroNaoAutorizadoParaGerenciarEquipes extends Error {
  constructor(
    message = "Apenas o gestor de uma equipe do ticket pode atribuir ou desatribuir equipes.",
  ) {
    super(message);
    this.name = "ErroNaoAutorizadoParaGerenciarEquipes";
  }
}

export class ErroEquipeInvalida extends Error {
  constructor(message = "Equipe inválida.") {
    super(message);
    this.name = "ErroEquipeInvalida";
  }
}

export class ErroTicketEncerrado extends Error {
  constructor(
    message = "Este ticket está encerrado e suas equipes não podem ser alteradas.",
  ) {
    super(message);
    this.name = "ErroTicketEncerrado";
  }
}

export class ErroUltimaEquipeDoTicket extends Error {
  constructor(
    message = "O ticket precisa ter pelo menos uma equipe atribuída.",
  ) {
    super(message);
    this.name = "ErroUltimaEquipeDoTicket";
  }
}

export const servicoTicket = new ServicoTicket();
