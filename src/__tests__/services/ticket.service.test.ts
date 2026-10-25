import { describe, expect, it, vi } from "vitest";
import { Cargo, Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import {
  ErroConflitoPrioridade,
  ErroNaoAutorizadoParaAlterarPrioridade,
  ErroTicketEncerrado,
  ServicoTicket,
} from "@/services/ticket.service";

type BancoTicket = ConstructorParameters<typeof ServicoTicket>[0];

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const gestorId = "550e8400-e29b-41d4-a716-446655440002";
const equipeId = "550e8400-e29b-41d4-a716-446655440003";

function criarBanco(gestor: unknown) {
  const transacao = {
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
    const tx = {
      ticket: { create: criar, findUniqueOrThrow: vi.fn().mockResolvedValue(ticket) },
      projeto: { findUnique: vi.fn().mockResolvedValue({ nome: "Projeto A" }) },
      atividadeConta: { create: atividade },
    };
    const banco = {
      ...tx,
      $transaction: vi.fn((operacao: (tx: typeof tx) => unknown) => operacao(tx)),
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
      ticket: {
        findUnique: vi.fn().mockResolvedValue(ticket),
        findUniqueOrThrow: vi.fn().mockResolvedValue(ticket),
      },
      ticketEquipe: { upsert },
    };
    const banco = {
      ...transaction,
      $transaction: vi.fn((operacao: (tx: typeof transaction) => unknown) => operacao(transaction)),
      usuario: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

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
    const servico = new ServicoTicket({
      ticket: { findMany: vi.fn().mockResolvedValue(tickets) },
    } as unknown as BancoTicket);

    const resultado = await servico.listarTodos();

    expect(resultado.map((ticket) => ticket.id)).toEqual(
      tickets.map((ticket) => ticket.id),
    );
  });

  it("ordena a lista da equipe pela mesma regra", async () => {
    const servico = new ServicoTicket({
      usuario: {
        findUnique: vi.fn().mockResolvedValue({
          ativo: true,
          equipe: { id: equipeId, nome: "Suporte", ativo: true },
        }),
      },
      ticket: { findMany: vi.fn().mockResolvedValue(tickets) },
    } as unknown as BancoTicket);

    const resultado = await servico.listarPorEquipeDoUsuario(gestorId);

    expect(resultado.map((ticket) => ticket.id)).toEqual([
      "critica-nova",
      "critica-antiga",
      "alta",
      "media",
      "baixa",
    ]);
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

  it.each(["atribuirEquipe", "desatribuirEquipe", "alocarEquipe"] as const)(
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
