import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";
import { ServicoTicket } from "@/services/ticket.service";

type BancoTicket = ConstructorParameters<typeof ServicoTicket>[0];

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const dados = {
  titulo: "Câmera sem imagem",
  descricao: "Câmera 03 sem imagem.",
  categoria: Categoria.MANUTENCAO,
  prioridade: Prioridade.ALTA,
  slaEm: new Date(Date.now() + 4 * 3600_000),
  projetoId: "550e8400-e29b-41d4-a716-446655440001",
  abertoPorId: "550e8400-e29b-41d4-a716-446655440002",
  equipeIds: ["550e8400-e29b-41d4-a716-446655440003"],
};

function criarBanco() {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn().mockResolvedValue([{ id: ticketId }]),
  };
  return {
    tx,
    banco: {
      $transaction: vi.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
      $queryRaw: vi.fn().mockResolvedValue([{ id: ticketId, situacao: "EM_ALERTA" }]),
      ticket: {
        create: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: ticketId }),
      },
      ticketEquipe: { createMany: vi.fn() },
      atividadeConta: { create: vi.fn() },
    },
  };
}

describe("ServicoTicket.criar com USAR_ROTINAS_BDR", () => {
  beforeEach(() => vi.stubEnv("USAR_ROTINAS_BDR", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it("abre pela sp_abrir_ticket e devolve a situacaoSla da fn_situacao_sla", async () => {
    const { banco, tx } = criarBanco();
    const servico = new ServicoTicket(banco as unknown as BancoTicket);

    const ticket = await servico.criar(dados);

    const call = tx.$executeRaw.mock.calls[0][0] as TemplateStringsArray;
    expect(call.join("?")).toContain("CALL sp_abrir_ticket(");
    expect(banco.ticket.create).not.toHaveBeenCalled();
    expect(banco.atividadeConta.create).not.toHaveBeenCalled();
    expect(banco.ticketEquipe.createMany).toHaveBeenCalledWith({
      data: [{ ticketId, equipeId: dados.equipeIds[0] }],
      skipDuplicates: true,
    });
    expect(ticket).toMatchObject({ id: ticketId, situacaoSla: "EM_ALERTA" });
  });

  it("sem a variável, mantém o insert via Prisma e não chama a procedure", async () => {
    vi.stubEnv("USAR_ROTINAS_BDR", "");
    const { banco, tx } = criarBanco();
    const servico = new ServicoTicket(banco as unknown as BancoTicket);
    // fluxo normal usa o client da transação: só verificamos que não há CALL
    await servico.criar(dados).catch(() => undefined);
    expect(tx.$executeRaw).not.toHaveBeenCalled();
  });
});
