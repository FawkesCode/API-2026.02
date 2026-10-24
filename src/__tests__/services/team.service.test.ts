import { describe, expect, it, vi } from "vitest";
import { Cargo } from "@/lib/generated/prisma/client";
import {
  ErroEquipeSemPermissao,
  InvalidTechnicianError,
  ServicoEquipe,
} from "@/services/equipe.service";

type TeamDatabase = ConstructorParameters<typeof ServicoEquipe>[0];
type MockTransaction = {
  equipe: { findUnique: ReturnType<typeof vi.fn> };
  atividadeConta: { create: ReturnType<typeof vi.fn> };
  usuario: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const technicianId = "550e8400-e29b-41d4-a716-446655440001";
const managerId = "550e8400-e29b-41d4-a716-446655440002";

function createService(options?: {
  team?: { id: string; ativo: boolean; nome?: string } | null;
  users?: { id: string; nome: string; cargo: Cargo }[];
  currentUsers?: { id: string; nome: string }[];
  result?: unknown[];
}) {
  const transaction = {
    equipe: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          options?.team === undefined ? { id: teamId, ativo: true, nome: "Equipe A" } : options.team,
        ),
    },
    atividadeConta: { create: vi.fn().mockResolvedValue({}) },
    usuario: {
      findUnique: vi.fn().mockResolvedValue({
        ativo: true,
        cargo: Cargo.GESTOR,
        equipeId: teamId,
      }),
      findMany: vi
        .fn()
        .mockResolvedValueOnce(
          options?.users ?? [{ id: technicianId, nome: "Técnico A", cargo: Cargo.TECNICO }],
        )
        .mockResolvedValueOnce(options?.currentUsers ?? [])
        .mockResolvedValueOnce(options?.result ?? []),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const database = {
    $transaction: vi.fn(
      async (operation: (transaction: MockTransaction) => unknown) =>
        operation(transaction as MockTransaction),
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
      service.replaceTechnicians(teamId, [technicianId], managerId),
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
    expect(transaction.atividadeConta.create).toHaveBeenCalledWith({
      data: {
        usuarioId: managerId,
        tipo: "EQUIPE",
        descricao: "Adicionou usuário Técnico A à equipe Equipe A.",
      },
    });
  });

  it("não altera usuários se algum ID não for de um técnico", async () => {
    const { service, transaction } = createService({
      users: [{ id: technicianId, nome: "Gestor A", cargo: Cargo.GESTOR }],
    });

    await expect(
      service.replaceTechnicians(teamId, [technicianId], managerId),
    ).rejects.toBeInstanceOf(InvalidTechnicianError);
    expect(transaction.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("retorna null sem alterar usuários se a equipe não existe", async () => {
    const { service, transaction } = createService({ team: null });

    await expect(
      service.replaceTechnicians(teamId, [technicianId], managerId),
    ).resolves.toBeNull();
    expect(transaction.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("não permite que um gestor altere os técnicos de outra equipe", async () => {
    const { service, transaction } = createService();
    transaction.usuario.findUnique.mockResolvedValue({
      ativo: true,
      cargo: Cargo.GESTOR,
      equipeId: "550e8400-e29b-41d4-a716-446655440009",
    });

    await expect(
      service.replaceTechnicians(teamId, [technicianId], managerId),
    ).rejects.toBeInstanceOf(ErroEquipeSemPermissao);
    expect(transaction.usuario.updateMany).not.toHaveBeenCalled();
  });

  it("permite esvaziar a equipe, desvinculando seus técnicos", async () => {
    const { service, transaction } = createService({ users: [], result: [] });

    await expect(service.replaceTechnicians(teamId, [], managerId)).resolves.toEqual([]);
    expect(transaction.usuario.updateMany).toHaveBeenCalledTimes(1);
    expect(transaction.usuario.updateMany).toHaveBeenCalledWith({
      where: { equipeId: teamId, cargo: Cargo.TECNICO },
      data: { equipeId: null },
    });
  });

  it("considera IDs repetidos uma única vez", async () => {
    const { service, transaction } = createService({
      users: [{ id: technicianId, nome: "Técnico A", cargo: Cargo.TECNICO }],
    });

    await service.replaceTechnicians(teamId, [technicianId, technicianId], managerId);

    expect(transaction.usuario.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [technicianId] } },
      select: { id: true, nome: true, cargo: true, equipeId: true },
    });
  });
});
