import { afterEach, describe, expect, it, vi } from "vitest";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { Cargo, Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErroConflitoPrioridade,
  ErroNaoAutorizadoParaAlterarPrioridade,
  ErroNaoAutorizadoParaGerenciarEquipes,
  ErroRelatorioEquipeInvalido,
  ErroTicketEncerrado,
  ServicoTicket,
} from "@/services/ticket.service";

type BancoTicket = ConstructorParameters<typeof ServicoTicket>[0];

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const gestorId = "550e8400-e29b-41d4-a716-446655440002";
const equipeId = "550e8400-e29b-41d4-a716-446655440003";

afterEach(() => vi.restoreAllMocks());

function criarBanco(gestor: unknown) {
  const transacao = {
    $queryRaw: vi.fn().mockResolvedValue([{ status: StatusTicket.EM_ANDAMENTO }]),
    ticket: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    usuario: { findUnique: vi.fn().mockResolvedValue(gestor) },
    historicoTicket: { create: vi.fn() },
  };
  const banco = {
    ticket: { create: vi.fn() },
    $transaction: vi.fn(async (callback: (tx: typeof transacao) => unknown) =>
      callback(transacao),
    ),
  };

  return { banco, transacao };
}

const ticketDaEquipe = {
  id: ticketId,
  prioridade: Prioridade.MEDIA,
  equipesAlocadas: [{ equipeId }],
};

const gestorDaEquipe = {
  id: gestorId,
  cargo: "GESTOR",
  ativo: true,
  equipeId,
};

describe("ServicoTicket.atualizarPrioridade", () => {
  it("não altera prioridade nem histórico para gestor inativo", async () => {
    const { banco, transacao } = criarBanco({
      ...gestorDaEquipe,
      ativo: false,
    });
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroNaoAutorizadoParaAlterarPrioridade);
    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("retorna null quando o ticket não existe", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue(null);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    expect(
      await servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).toBeNull();
    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("repetir a prioridade atual não gera nova atualização nem histórico", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    transacao.ticket.findUniqueOrThrow.mockResolvedValue(ticketDaEquipe);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await servico.atualizarPrioridade(ticketId, {
      prioridade: Prioridade.MEDIA,
      usuarioId: gestorId,
    });

    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("avisa sobre alteração concorrente sem registrar histórico de uma mudança perdida", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    transacao.ticket.updateMany.mockResolvedValue({ count: 0 });
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroConflitoPrioridade);
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("não altera a prioridade de ticket encerrado", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue({
      ...ticketDaEquipe,
      status: StatusTicket.ENCERRADO,
    });
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroTicketEncerrado);
    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("persiste a prioridade e registra o histórico para gestor da equipe", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    transacao.ticket.updateMany.mockResolvedValue({ count: 1 });
    transacao.ticket.findUniqueOrThrow.mockResolvedValue({
      id: ticketId,
      prioridade: Prioridade.CRITICA,
    });
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    const ticket = await servico.atualizarPrioridade(ticketId, {
      prioridade: Prioridade.CRITICA,
      usuarioId: gestorId,
    });

    expect(ticket).toMatchObject({ prioridade: Prioridade.CRITICA });
    expect(transacao.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: ticketId, prioridade: Prioridade.MEDIA },
      data: { prioridade: Prioridade.CRITICA },
    });
    expect(transacao.historicoTicket.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ticketId,
        usuarioId: gestorId,
        evento: "PRIORIDADE_ALTERADA",
      }),
    });
  });

  it("permite gestor alocado mesmo quando o projeto pertence a outra equipe", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue({
      ...ticketDaEquipe,
      projeto: { equipeId: "outra-equipe" },
    });
    transacao.ticket.updateMany.mockResolvedValue({ count: 1 });
    transacao.ticket.findUniqueOrThrow.mockResolvedValue(ticketDaEquipe);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);
    await servico.atualizarPrioridade(ticketId, {
      prioridade: Prioridade.ALTA,
      usuarioId: gestorId,
    });
    expect(transacao.ticket.updateMany).toHaveBeenCalledOnce();
  });

  it("bloqueia gestor do projeto quando sua equipe não está alocada", async () => {
    const { banco, transacao } = criarBanco(gestorDaEquipe);
    transacao.ticket.findUnique.mockResolvedValue({
      ...ticketDaEquipe,
      equipesAlocadas: [],
      projeto: { equipeId },
    });
    const servico = new ServicoTicket(banco as unknown as BancoTicket);
    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.ALTA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroNaoAutorizadoParaAlterarPrioridade);
    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
  });

  it("não altera a prioridade quando o gestor é de outra equipe", async () => {
    const { banco, transacao } = criarBanco({
      ...gestorDaEquipe,
      equipeId: "550e8400-e29b-41d4-a716-446655440004",
    });
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroNaoAutorizadoParaAlterarPrioridade);

    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("não altera a prioridade quando o usuário não é gestor", async () => {
    const { banco, transacao } = criarBanco({
      ...gestorDaEquipe,
      cargo: Cargo.TECNICO,
    });
    transacao.ticket.findUnique.mockResolvedValue(ticketDaEquipe);
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await expect(
      servico.atualizarPrioridade(ticketId, {
        prioridade: Prioridade.CRITICA,
        usuarioId: gestorId,
      }),
    ).rejects.toBeInstanceOf(ErroNaoAutorizadoParaAlterarPrioridade);

    expect(transacao.ticket.updateMany).not.toHaveBeenCalled();
    expect(transacao.historicoTicket.create).not.toHaveBeenCalled();
  });
});

describe("ServicoTicket equipes", () => {
  it("persiste as equipes selecionadas ao criar ticket, sem duplicar IDs repetidos", async () => {
    const ticket = { id: ticketId, titulo: "Falha no equipamento" };
    const criar = vi.fn().mockResolvedValue(ticket);
    const atividade = vi.fn().mockResolvedValue({});
    const transacao = {
      ticket: { create: criar, findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
      projeto: { findUnique: vi.fn().mockResolvedValue({ nome: "Projeto A" }) },
      atividadeConta: { create: atividade },
    };
    const banco = {
      ...transacao,
      $transaction: vi.fn(
        (operacao: (tx: typeof transacao) => unknown) => operacao(transacao),
      ),
    };
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await servico.criar({
      titulo: "Falha no equipamento",
      descricao: "O equipamento precisa de manutenção.",
      categoria: "MANUTENCAO",
      prioridade: Prioridade.MEDIA,
      slaEm: new Date("2030-01-01T00:00:00.000Z"),
      projetoId: "550e8400-e29b-41d4-a716-446655440000",
      abertoPorId: gestorId,
      equipeIds: [equipeId, equipeId],
    });

    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          equipesAlocadas: {
            create: [{ equipeId }],
          },
        }),
      }),
    );
    expect(atividade).toHaveBeenCalledWith({
      data: {
        usuarioId: gestorId,
        tipo: "TICKET | ABERTURA",
        descricao: "Abriu o ticket Falha no equipamento vinculado ao projeto Projeto A.",
      },
    });
  });

  it("atribui equipe de forma idempotente", async () => {
    const ticket = { id: ticketId, titulo: "Falha no equipamento" };
    const upsert = vi.fn();
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ status: StatusTicket.EM_ANDAMENTO }]),
      ticket: {
        findUnique: vi.fn().mockResolvedValue(ticket),
        findUniqueOrThrow: vi.fn().mockResolvedValue(ticket),
      },
      ticketEquipe: { upsert },
    };
    const banco = {
      ...transaction,
      $transaction: vi.fn((operacao: (tx: typeof transaction) => unknown) => operacao(transaction)),
    };
    const servico = new ServicoTicket(banco as unknown as BancoTicket);
    vi.spyOn(servico, "notificarGestorDaEquipe").mockResolvedValue("SEM_GESTOR");

    await servico.alocarEquipe(ticketId, equipeId);

    expect(upsert).toHaveBeenCalledWith({
      where: { ticketId_equipeId: { ticketId, equipeId } },
      create: { ticketId, equipeId },
      update: {},
    });
  });

  it("registra no perfil do gestor quando ele desatribui a equipe", async () => {
    const ticket = { id: ticketId, titulo: "Falha no equipamento" };
    const atividade = vi.fn().mockResolvedValue({});
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ status: StatusTicket.EM_ANDAMENTO }]),
      ticket: { findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
      ticketEquipe: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      equipe: { findUnique: vi.fn().mockResolvedValue({ nome: "Equipe Azul" }) },
      atividadeConta: { create: atividade },
    };
    const banco = {
      ticket: {
        findUnique: vi.fn().mockResolvedValue(ticket),
        findUniqueOrThrow: vi.fn().mockResolvedValue(ticket),
      },
      $transaction: vi.fn((operacao: (tx: typeof transaction) => unknown) => operacao(transaction)),
    };
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    await servico.desalocarEquipe(ticketId, equipeId, gestorId);

    expect(atividade).toHaveBeenCalledWith({
      data: {
        usuarioId: gestorId,
        tipo: "TICKET",
        descricao: "Desatribuiu equipe Equipe Azul do ticket Falha no equipamento.",
      },
    });
  });
});

describe("ordenação das listas de tickets", () => {
  const dataNova = new Date("2026-09-25T12:00:00.000Z");
  const dataAntiga = new Date("2026-09-24T12:00:00.000Z");
  const tickets = [
    { id: "media", prioridade: Prioridade.MEDIA, criadoEm: dataNova },
    { id: "baixa", prioridade: Prioridade.BAIXA, criadoEm: dataNova },
    {
      id: "critica-antiga",
      prioridade: Prioridade.CRITICA,
      criadoEm: dataAntiga,
    },
    { id: "critica-nova", prioridade: Prioridade.CRITICA, criadoEm: dataNova },
    { id: "alta", prioridade: Prioridade.ALTA, criadoEm: dataNova },
  ];

  it("mantém a lista geral em ordem de criação mais recente", async () => {
    vi.spyOn(prisma.ticket, "count").mockResolvedValue(tickets.length);
    const findMany = vi.spyOn(prisma.ticket, "findMany").mockResolvedValue(tickets as never);
    const servico = new ServicoTicket();

    const resultado = await servico.listarTodos();

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip: 0,
      take: 5,
    }));
    expect(resultado.itens.map((ticket) => ticket.id)).toEqual(
      tickets.map((ticket) => ticket.id),
    );
  });

  it("ordena a lista da equipe pela mesma regra", async () => {
    const findMany = vi.fn().mockResolvedValue(tickets);
    const count = vi.fn().mockResolvedValue(tickets.length);
    const servico = new ServicoTicket({
      usuario: {
        findUnique: vi.fn().mockResolvedValue({
          ativo: true,
          equipe: { id: equipeId, nome: "Suporte", ativo: true },
        }),
      },
      ticket: { count, findMany },
    } as unknown as BancoTicket);

    const resultado = await servico.listarPorEquipeDoUsuario(gestorId);

    const where = { equipesAlocadas: { some: { equipeId } } };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip: 0,
      take: 5,
    }));
    expect(resultado).toEqual(tickets);
  });
});

describe("filtro de data da lista geral de tickets", () => {
  it("usa as duas datas inclusivas na contagem e na segunda página", async () => {
    const count = vi.fn().mockResolvedValue(6);
    const findMany = vi.fn().mockResolvedValue([]);
    const servico = new ServicoTicket({ ticket: { count, findMany } } as unknown as BancoTicket);
    const filtros = {
      dataInicio: "2026-09-24",
      dataFim: "2026-09-25",
      // Em caso de URL antiga com os dois formatos, o período tem prioridade.
      data: "2026-11-16",
      pagina: 2,
      itensPorPagina: 5,
    };
    const whereIntervalo = {
      criadoEm: {
        gte: startOfDay(parseISO("2026-09-24")),
        lte: endOfDay(parseISO("2026-09-25")),
      },
    };
    const escopo = { status: StatusTicket.EM_ANDAMENTO };
    await servico.listarTodos(filtros, escopo);

    const where = { AND: [whereIntervalo, escopo] };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip: 5,
      take: 5,
    }));
  });

  it("mantém o filtro por dia único e ignora datas inválidas sem quebrar a lista", async () => {
    const count = vi.fn().mockResolvedValue(0);
    const servico = new ServicoTicket({
      ticket: { count, findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as BancoTicket);
    const data = "2026-09-25";
    await servico.listarTodos({ data, pagina: 1, itensPorPagina: 5 });
    await servico.listarTodos({ data: "2026-02-30", pagina: 1, itensPorPagina: 5 });

    expect(count).toHaveBeenNthCalledWith(1, {
      where: { criadoEm: { gte: startOfDay(parseISO(data)), lte: endOfDay(parseISO(data)) } },
    });
    expect(count).toHaveBeenNthCalledWith(2, { where: {} });
  });
});

describe("menção de equipe por técnico", () => {
  const tecnico = { ativo: true, cargo: Cargo.TECNICO, equipeId };
  const destinoId = "outra-equipe";

  function setup(usuario = tecnico, jaAssociada = false) {
    const ticket = {
      id: ticketId,
      titulo: "Falha no equipamento",
      descricao: "Descrição do ticket",
      status: StatusTicket.EM_ANDAMENTO,
      equipesAlocadas: [{ equipeId }, ...(jaAssociada ? [{ equipeId: destinoId }] : [])],
    };
    const { banco, transacao } = criarBanco(usuario);
    transacao.ticket.findUnique.mockResolvedValue(ticket);
    const create = vi.fn();
    const deleteMany = vi.fn();
    const db = {
      ...banco,
      ticket: { ...banco.ticket, findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
      $transaction: vi.fn(async (callback) => callback({
        ...transacao,
        equipe: { findUnique: vi.fn().mockResolvedValue({ ativo: true, nome: "Suporte" }) },
        ticketEquipe: { create, deleteMany },
        atividadeConta: { create: vi.fn() },
      })),
    };
    return { servico: new ServicoTicket(db as unknown as BancoTicket), create, deleteMany };
  }

  it("vincula a equipe e encaminha o motivo informado para a notificação existente", async () => {
    const { servico, create } = setup();

    await expect(servico.atribuirEquipe(ticketId, destinoId, gestorId, "  Precisamos de apoio.  "))
      .resolves.toMatchObject({ jaAlocada: false, notificarEmail: true, relatorio: "Precisamos de apoio." });
    expect(create).toHaveBeenCalledExactlyOnceWith({ data: { ticketId, equipeId: destinoId } });
  });

  it("não volta a vincular ou notificar uma equipe já associada", async () => {
    const { servico, create } = setup(tecnico, true);
    await expect(servico.atribuirEquipe(ticketId, destinoId, gestorId, "Apoio"))
      .resolves.toMatchObject({ jaAlocada: true, notificarEmail: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("exige o relatório do técnico mesmo quando o ticket tem descrição", async () => {
    const { servico, create } = setup();
    await expect(servico.atribuirEquipe(ticketId, destinoId, gestorId))
      .rejects.toBeInstanceOf(ErroRelatorioEquipeInvalido);
    expect(create).not.toHaveBeenCalled();
  });

  it.each([{ ...tecnico, equipeId: "equipe-externa" }, { ...tecnico, ativo: false }])(
    "rejeita técnico inativo ou de fora do ticket (%#)",
    async (usuario) => {
      const { servico, create } = setup(usuario);
      await expect(servico.atribuirEquipe(ticketId, destinoId, gestorId, "Apoio"))
        .rejects.toBeInstanceOf(ErroNaoAutorizadoParaGerenciarEquipes);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it("mantém a remoção de equipes restrita a gestores", async () => {
    const { servico, deleteMany } = setup(tecnico, true);
    await expect(servico.desatribuirEquipe(ticketId, destinoId, gestorId))
      .rejects.toBeInstanceOf(ErroNaoAutorizadoParaGerenciarEquipes);
    expect(deleteMany).not.toHaveBeenCalled();
  });
});

describe("equipes de ticket encerrado", () => {
  const ticketEncerrado = {
    id: ticketId,
    titulo: "Falha no equipamento",
    status: StatusTicket.ENCERRADO,
    equipesAlocadas: [{ equipeId }, { equipeId: "outra-equipe" }],
  };
  const gestor = { ativo: true, cargo: Cargo.GESTOR, equipeId };

  function criarServico() {
    const transacao = {
      $queryRaw: vi.fn().mockResolvedValue([{ status: StatusTicket.ENCERRADO }]),
      ticket: { findUnique: vi.fn().mockResolvedValue(ticketEncerrado) },
      usuario: { findUnique: vi.fn().mockResolvedValue(gestor) },
      equipe: { findUnique: vi.fn() },
      ticketEquipe: { deleteMany: vi.fn(), upsert: vi.fn() },
    };
    const banco = {
      ticket: { findUnique: vi.fn().mockResolvedValue(ticketEncerrado) },
      $transaction: vi.fn(async (callback: (tx: typeof transacao) => unknown) =>
        callback(transacao),
      ),
    };
    return {
      servico: new ServicoTicket(banco as unknown as BancoTicket),
      transacao,
    };
  }

  it.each(["atribuirEquipe", "desatribuirEquipe", "alocarEquipe", "desalocarEquipe"] as const)(
    "%s recusa ticket encerrado",
    async (metodo) => {
      const { servico, transacao } = criarServico();

      await expect(
        servico[metodo](ticketId, "outra-equipe", gestorId),
      ).rejects.toBeInstanceOf(ErroTicketEncerrado);
      expect(transacao.ticketEquipe.deleteMany).not.toHaveBeenCalled();
      expect(transacao.ticketEquipe.upsert).not.toHaveBeenCalled();
    },
  );
});
