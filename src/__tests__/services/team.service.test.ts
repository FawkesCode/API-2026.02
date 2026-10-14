import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  servicoEquipe,
  TeamNameInUseError,
  UnauthorizedTeamEditError,
} from "@/services/equipe.service";

const teamId = "550e8400-e29b-41d4-a716-446655440003";
const managerId = "550e8400-e29b-41d4-a716-446655440002";
const manager = { id: managerId, ativo: true, cargo: "GESTOR", equipeId: teamId };

function mockTransaction({
  equipe = { id: teamId } as object | null,
  usuario = manager as object | null,
  homonima = null as object | null,
} = {}) {
  const tx = {
    equipe: {
      findUnique: vi.fn().mockResolvedValue(equipe),
      findFirst: vi.fn().mockResolvedValue(homonima),
      update: vi.fn().mockResolvedValue({ id: teamId }),
    },
    usuario: { findUnique: vi.fn().mockResolvedValue(usuario) },
  };
  vi.spyOn(prisma, "$transaction").mockImplementation(((
    fn: (client: typeof tx) => unknown,
  ) => fn(tx)) as never);
  return tx;
}

afterEach(() => vi.restoreAllMocks());

describe("ServicoEquipe.update", () => {
  it("retorna null quando a equipe não existe", async () => {
    const tx = mockTransaction({ equipe: null });

    await expect(
      servicoEquipe.update(teamId, { nome: "X", usuarioId: managerId }),
    ).resolves.toBeNull();
    expect(tx.equipe.update).not.toHaveBeenCalled();
  });

  it.each([
    ["usuário inexistente", null],
    ["usuário inativo", { ...manager, ativo: false }],
    ["cargo diferente de GESTOR", { ...manager, cargo: "TECNICO" }],
    ["gestor de outra equipe", { ...manager, equipeId: "outra-equipe" }],
    ["gestor sem equipe", { ...manager, equipeId: null }],
  ])("bloqueia %s", async (_caso, usuario) => {
    const tx = mockTransaction({ usuario });

    await expect(
      servicoEquipe.update(teamId, { nome: "X", usuarioId: managerId }),
    ).rejects.toBeInstanceOf(UnauthorizedTeamEditError);
    expect(tx.equipe.update).not.toHaveBeenCalled();
  });

  it("bloqueia nome já usado por outra equipe", async () => {
    const tx = mockTransaction({ homonima: { id: "outra" } });

    await expect(
      servicoEquipe.update(teamId, { nome: "Equipe Massa", usuarioId: managerId }),
    ).rejects.toBeInstanceOf(TeamNameInUseError);
    expect(tx.equipe.findFirst).toHaveBeenCalledWith({
      where: { nome: "Equipe Massa", id: { not: teamId } },
      select: { id: true },
    });
    expect(tx.equipe.update).not.toHaveBeenCalled();
  });

  it("atualiza só a descrição sem checar nem tocar no nome", async () => {
    const tx = mockTransaction();

    await servicoEquipe.update(teamId, {
      descricao: "Nova descrição",
      usuarioId: managerId,
    });

    expect(tx.equipe.findFirst).not.toHaveBeenCalled();
    expect(tx.equipe.update).toHaveBeenCalledWith({
      where: { id: teamId },
      data: { descricao: "Nova descrição" },
      select: { id: true, nome: true, descricao: true, ativo: true },
    });
  });

  it("atualiza nome e descrição juntos", async () => {
    const tx = mockTransaction();

    await servicoEquipe.update(teamId, {
      nome: "Equipe Norte",
      descricao: null,
      usuarioId: managerId,
    });

    expect(tx.equipe.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { nome: "Equipe Norte", descricao: null },
      }),
    );
  });
});
