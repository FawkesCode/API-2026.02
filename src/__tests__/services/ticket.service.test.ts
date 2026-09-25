import { describe, expect, it, vi } from "vitest";
import { Prioridade } from "@/lib/generated/prisma/client";
import {
  ErroNaoAutorizadoParaAlterarPrioridade,
  ServicoTicket,
} from "@/lib/services/ticket.service";

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
    $transaction: vi.fn(
      async (callback: (tx: typeof transacao) => unknown) => callback(transacao),
    ),
  };

  return { banco, transacao };
}

const ticketDaEquipe = {
  id: ticketId,
  prioridade: Prioridade.MEDIA,
  projeto: { equipeId },
};

const gestorDaEquipe = {
  id: gestorId,
  cargo: "GESTOR",
  ativo: true,
  equipeId,
};

describe("ServicoTicket.atualizarPrioridade", () => {
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
});

describe("ServicoTicket equipes", () => {
  it("persiste as equipes selecionadas ao criar ticket, sem duplicar IDs repetidos", async () => {
    const ticket = { id: ticketId };
    const criar = vi.fn().mockResolvedValue(ticket);
    const servico = new ServicoTicket({
      ticket: { create: criar },
    } as unknown as BancoTicket);

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
  });

  it("atribui equipe de forma idempotente", async () => {
    const ticket = { id: ticketId };
    const upsert = vi.fn();
    const servico = new ServicoTicket({
      ticket: {
        findUnique: vi.fn().mockResolvedValue(ticket),
        findUniqueOrThrow: vi.fn().mockResolvedValue(ticket),
      },
      ticketEquipe: { upsert },
    } as unknown as BancoTicket);

    await servico.alocarEquipe(ticketId, equipeId);

    expect(upsert).toHaveBeenCalledWith({
      where: { ticketId_equipeId: { ticketId, equipeId } },
      create: { ticketId, equipeId },
      update: {},
    });
  });
});

describe("ordenação das listas de tickets", () => {
  const dataNova = new Date("2026-09-25T12:00:00.000Z");
  const dataAntiga = new Date("2026-09-24T12:00:00.000Z");
  const tickets = [
    { id: "media", prioridade: Prioridade.MEDIA, criadoEm: dataNova },
    { id: "baixa", prioridade: Prioridade.BAIXA, criadoEm: dataNova },
    { id: "critica-antiga", prioridade: Prioridade.CRITICA, criadoEm: dataAntiga },
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
