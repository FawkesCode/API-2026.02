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
