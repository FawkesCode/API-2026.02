import { describe, expect, it, vi } from "vitest";
import { Cargo } from "@/lib/generated/prisma/client";
import {
  InvalidTechnicianError,
  ServicoEquipe,
} from "@/services/equipe.service";

type TeamDatabase = ConstructorParameters<typeof ServicoEquipe>[0];

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const technicianId = "550e8400-e29b-41d4-a716-446655440001";

function createService(options?: {
  team?: { id: string } | null;
  users?: { id: string; cargo: Cargo }[];
  result?: unknown[];
}) {
  const transaction = {
    equipe: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          options?.team === undefined ? { id: teamId } : options.team,
        ),
    },
    usuario: {
      findMany: vi
        .fn()
        .mockResolvedValueOnce(
          options?.users ?? [{ id: technicianId, cargo: Cargo.TECNICO }],
        )
        .mockResolvedValueOnce(options?.result ?? []),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const database = {
    $transaction: vi.fn(
      async (operation: (transaction: typeof transaction) => unknown) =>
        operation(transaction),
    ),
  };

  return {
    service: new ServicoEquipe(database as unknown as TeamDatabase),
    transaction,
    database,
  };
}

describe("ServicoEquipe.replaceTechnicians", () => {
  it("remove os técnicos ausentes, vincula os informados e retorna a lista final", async () => {
    const result = [
      {
        id: technicianId,
        nome: "Técnico",
        email: "tecnico@example.com",
        cargo: Cargo.TECNICO,
        equipeId: teamId,
      },
    ];
    const { service, transaction, database } = createService({ result });

    await expect(
      service.replaceTechnicians(teamId, [technicianId]),
    ).resolves.toEqual(result);
    expect(database.$transaction).toHaveBeenCalledOnce();
    expect(transaction.usuario.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        equipeId: teamId,
        cargo: Cargo.TECNICO,
        id: { notIn: [technicianId] },
      },
      data: { equipeId: null },
    });
    expect(transaction.usuario.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [technicianId] }, cargo: Cargo.TECNICO },
      data: { equipeId: teamId },
    });
  });

  it("não altera usuários se algum ID não for de um técnico", async () => {
    const { service, transaction } = createService({
      users: [{ id: technicianId, cargo: Cargo.GESTOR }],
    });

    await expect(
      service.replaceTechnicians(teamId, [technicianId]),
    ).rejects.toBeInstanceOf(InvalidTechnicianError);
    expect(transaction.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("retorna null sem alterar usuários se a equipe não existe", async () => {
    const { service, transaction } = createService({ team: null });

    await expect(
      service.replaceTechnicians(teamId, [technicianId]),
    ).resolves.toBeNull();
    expect(transaction.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("permite esvaziar a equipe, desvinculando seus técnicos", async () => {
    const { service, transaction } = createService({ users: [], result: [] });

    await expect(service.replaceTechnicians(teamId, [])).resolves.toEqual([]);
    expect(transaction.usuario.updateMany).toHaveBeenCalledTimes(1);
    expect(transaction.usuario.updateMany).toHaveBeenCalledWith({
      where: { equipeId: teamId, cargo: Cargo.TECNICO },
      data: { equipeId: null },
    });
  });

  it("considera IDs repetidos uma única vez", async () => {
    const { service, transaction } = createService({
      users: [{ id: technicianId, cargo: Cargo.TECNICO }],
    });

    await service.replaceTechnicians(teamId, [technicianId, technicianId]);

    expect(transaction.usuario.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [technicianId] } },
      select: { id: true, cargo: true },
    });
  });
});
