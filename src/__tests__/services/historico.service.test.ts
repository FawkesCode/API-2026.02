import { describe, expect, it, vi } from "vitest";
import { Cargo, StatusTicket } from "@/lib/generated/prisma/client";
import {
  ServicoHistoricoTicket,
  TransicaoTicketInvalidaError,
  UsuarioSemAcessoAoTicketError,
} from "@/services/historico.service";

function preparar({
  cargo = Cargo.GESTOR as Cargo,
  equipeId = "equipe",
  ativo = true,
  status = StatusTicket.SOLICITACAO_ENCERRAMENTO as StatusTicket,
  count = 1,
} = {}) {
  const tx = {
    ticket: {
      findUnique: vi
        .fn()
        .mockResolvedValue({
          status,
          equipesAlocadas: [{ equipeId: "equipe" }],
        }),
      updateMany: vi.fn().mockResolvedValue({ count }),
    },
    usuario: {
      findUnique: vi.fn().mockResolvedValue({ cargo, equipeId, ativo }),
    },
    historicoTicket: { create: vi.fn().mockResolvedValue({ id: "log" }) },
  };
  const db = {
    $transaction: vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback(tx),
    ),
  };
  const servico = new ServicoHistoricoTicket(
    db as unknown as ConstructorParameters<typeof ServicoHistoricoTicket>[0],
  );
  return { servico, tx };
}
const dados = {
  usuarioId: "gestor",
  descricao: "Decisão",
  evento: "ENCERRAMENTO_APROVADO",
};

describe("decisões de encerramento", () => {
  it.each([
    ["ENCERRAMENTO_APROVADO", StatusTicket.ENCERRADO],
    ["ENCERRAMENTO_NEGADO", StatusTicket.EM_REVISAO],
  ])("%s atualiza o status e registra histórico", async (evento, destino) => {
    const { servico, tx } = preparar();
    await servico.criar("ticket", { ...dados, evento });
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: "ticket", status: StatusTicket.SOLICITACAO_ENCERRAMENTO },
      data: {
        status: destino,
        encerradoEm:
          destino === StatusTicket.ENCERRADO ? expect.any(Date) : null,
      },
    });
    expect(tx.historicoTicket.create).toHaveBeenCalledOnce();
  });

  it.each([{ equipeId: "outra" }, { cargo: Cargo.TECNICO }, { ativo: false }])(
    "bloqueia usuário sem autorização: %j",
    async (usuario) => {
      const { servico, tx } = preparar(usuario);
      await expect(servico.criar("ticket", dados)).rejects.toBeInstanceOf(
        UsuarioSemAcessoAoTicketError,
      );
      expect(tx.ticket.updateMany).not.toHaveBeenCalled();
      expect(tx.historicoTicket.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    StatusTicket.EM_ANDAMENTO,
    StatusTicket.ENCERRADO,
    StatusTicket.EM_REVISAO,
  ])("não decide fora da solicitação: %s", async (status) => {
    const { servico, tx } = preparar({ status });
    await expect(servico.criar("ticket", dados)).rejects.toBeInstanceOf(
      TransicaoTicketInvalidaError,
    );
    expect(tx.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("não registra decisão concorrente perdida", async () => {
    const { servico, tx } = preparar({ count: 0 });
    await expect(servico.criar("ticket", dados)).rejects.toBeInstanceOf(
      TransicaoTicketInvalidaError,
    );
    expect(tx.historicoTicket.create).not.toHaveBeenCalled();
  });

  it("solicitar encerramento altera o status", async () => {
    const { servico, tx } = preparar({
      cargo: Cargo.TECNICO,
      status: StatusTicket.EM_ANDAMENTO,
    });
    await servico.criar("ticket", {
      ...dados,
      evento: "ENCERRAMENTO_SOLICITADO",
    });
    expect(tx.ticket.updateMany).toHaveBeenCalledWith({
      where: { id: "ticket", status: StatusTicket.EM_ANDAMENTO },
      data: {
        status: StatusTicket.SOLICITACAO_ENCERRAMENTO,
        encerradoEm: null,
      },
    });
  });

  it("não permite simular mudança de prioridade através de log", async () => {
    const { servico } = preparar();
    await expect(
      servico.criar("ticket", { ...dados, evento: "PRIORIDADE_ALTERADA" }),
    ).rejects.toBeInstanceOf(UsuarioSemAcessoAoTicketError);
  });
});
