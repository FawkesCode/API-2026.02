import { describe, expect, it, vi } from "vitest";
import { Cargo, Prisma } from "@/lib/generated/prisma/client";
import {
  ErroEquipeNaoEncontrada,
  ErroEquipeSemPermissao,
  ErroNomeEquipeDuplicado,
  ErroTecnicosInvalidos,
  ServicoEquipe,
} from "@/services/equipe.service";

type TeamDatabase = ConstructorParameters<typeof ServicoEquipe>[0];

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const technicianId = "550e8400-e29b-41d4-a716-446655440001";
const managerId = "550e8400-e29b-41d4-a716-446655440002";
const manager = {
  id: managerId,
  ativo: true,
  cargo: Cargo.GESTOR,
  equipeId: teamId,
};

function createService(options?: {
  team?: { ativo: boolean } | null;
  requester?: object | null;
  candidates?: { id: string; equipeId: string | null }[];
  linkedCount?: number;
  updateError?: Error;
}) {
  const tx = {
    equipe: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          options?.team === undefined ? { ativo: true } : options.team,
        ),
      update: options?.updateError
        ? vi.fn().mockRejectedValue(options.updateError)
        : vi.fn().mockResolvedValue({}),
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ id: teamId, nome: "Equipe", descricao: null }),
    },
    usuario: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          options?.requester === undefined ? manager : options.requester,
        ),
      findMany: vi.fn().mockResolvedValue(options?.candidates ?? []),
      updateMany: vi
        .fn()
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: options?.linkedCount ?? 1 }),
    },
  };
  const database = {
    $transaction: vi.fn(async (operation: (client: unknown) => unknown) =>
      operation(tx),
    ),
  };

  return {
    service: new ServicoEquipe(database as unknown as TeamDatabase),
    tx,
  };
}

describe("ServicoEquipe.atualizar", () => {
  it("responde 404 (equipe não encontrada) antes de checar a permissão", async () => {
    const { service, tx } = createService({ team: null, requester: null });

    await expect(
      service.atualizar(teamId, managerId, { nome: "X" }),
    ).rejects.toBeInstanceOf(ErroEquipeNaoEncontrada);
    expect(tx.usuario.findUnique).not.toHaveBeenCalled();
  });

  it("trata equipe inativa como não encontrada", async () => {
    const { service } = createService({ team: { ativo: false } });

    await expect(
      service.atualizar(teamId, managerId, { nome: "X" }),
    ).rejects.toBeInstanceOf(ErroEquipeNaoEncontrada);
  });

  it.each([
    ["usuário inexistente", null],
    ["usuário inativo", { ...manager, ativo: false }],
    ["cargo diferente de GESTOR", { ...manager, cargo: Cargo.TECNICO }],
    ["gestor de outra equipe", { ...manager, equipeId: "outra-equipe" }],
  ])("bloqueia %s", async (_caso, requester) => {
    const { service, tx } = createService({ requester });

    await expect(
      service.atualizar(teamId, managerId, { nome: "X" }),
    ).rejects.toBeInstanceOf(ErroEquipeSemPermissao);
    expect(tx.equipe.update).not.toHaveBeenCalled();
  });

  it("atualiza só a descrição, sem tocar no nome nem nos técnicos", async () => {
    const { service, tx } = createService();

    await service.atualizar(teamId, managerId, { descricao: "Nova" });

    expect(tx.equipe.update).toHaveBeenCalledWith({
      where: { id: teamId },
      data: { descricao: "Nova" },
    });
    expect(tx.usuario.findMany).not.toHaveBeenCalled();
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("atualiza só os técnicos, sem dar update na equipe", async () => {
    const { service, tx } = createService({
      candidates: [{ id: technicianId, equipeId: null }],
    });

    await service.atualizar(teamId, managerId, {
      tecnicosIds: [technicianId, technicianId],
    });

    expect(tx.equipe.update).not.toHaveBeenCalled();
    expect(tx.usuario.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        equipeId: teamId,
        cargo: Cargo.TECNICO,
        ativo: true,
        id: { notIn: [technicianId] },
      },
      data: { equipeId: null },
    });
    expect(tx.usuario.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: { in: [technicianId] },
        ativo: true,
        cargo: Cargo.TECNICO,
        equipeId: null,
      },
      data: { equipeId: teamId },
    });
  });

  it("aplica nome, descrição e técnicos juntos (corpo do modal)", async () => {
    const { service, tx } = createService({
      candidates: [{ id: technicianId, equipeId: teamId }],
    });

    await expect(
      service.atualizar(teamId, managerId, {
        nome: "Equipe Norte",
        descricao: null,
        tecnicosIds: [technicianId],
      }),
    ).resolves.toEqual({ id: teamId, nome: "Equipe", descricao: null });
    expect(tx.equipe.update).toHaveBeenCalledWith({
      where: { id: teamId },
      data: { nome: "Equipe Norte", descricao: null },
    });
  });

  it("rejeita técnico inválido ou de outra equipe", async () => {
    const { service } = createService({ candidates: [] });

    await expect(
      service.atualizar(teamId, managerId, { tecnicosIds: [technicianId] }),
    ).rejects.toBeInstanceOf(ErroTecnicosInvalidos);
  });

  it("desfaz quando outro pedido aloca o técnico no meio da operação", async () => {
    const { service } = createService({
      candidates: [{ id: technicianId, equipeId: null }],
      linkedCount: 0,
    });

    await expect(
      service.atualizar(teamId, managerId, { tecnicosIds: [technicianId] }),
    ).rejects.toBeInstanceOf(ErroTecnicosInvalidos);
  });

  it("converte violação de nome único (P2002) em nome duplicado", async () => {
    const { service } = createService({
      updateError: new Prisma.PrismaClientKnownRequestError("unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    });

    await expect(
      service.atualizar(teamId, managerId, { nome: "Equipe Sul" }),
    ).rejects.toBeInstanceOf(ErroNomeEquipeDuplicado);
  });
});
