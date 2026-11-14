import { afterEach, describe, expect, it, vi } from "vitest";
import { Cargo } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErroAlterarProprioStatus,
  ErroUsuarioNaoEncontrado,
  servicoUsuario,
} from "@/services/usuario.service";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const editorId = "550e8400-e29b-41d4-a716-446655440002";

afterEach(() => vi.restoreAllMocks());

function mockDatabase(current: { ativo: boolean; cargo?: Cargo } | null) {
  const transaction = vi
    .spyOn(prisma, "$transaction")
    .mockImplementation(((fn: (tx: typeof prisma) => unknown) =>
      fn(prisma)) as never);
  vi.spyOn(prisma.usuario, "findUnique").mockResolvedValue(
    (current
      ? { id: userId, nome: "Ana Silva", cargo: Cargo.TECNICO, ...current }
      : null) as never,
  );
  const updateUsuario = vi
    .spyOn(prisma.usuario, "update")
    .mockImplementation((async (args: { data: Record<string, unknown> }) => ({
      id: userId,
      nome: "Ana Silva",
      cargo: current?.cargo ?? Cargo.TECNICO,
      ...args.data,
    })) as never);
  const createAtividade = vi
    .spyOn(prisma.atividadeConta, "create")
    .mockResolvedValue({} as never);
  return { transaction, updateUsuario, createAtividade };
}

describe("ServicoUsuario.updateUserStatus", () => {
  it("inativa o usuário gravando só o campo ativo", async () => {
    const db = mockDatabase({ ativo: true });

    const user = await servicoUsuario.updateUserStatus(userId, editorId, false);

    const args = db.updateUsuario.mock.calls[0][0];
    expect(args.where).toEqual({ id: userId });
    expect(args.data).toEqual({ ativo: false });
    expect(args.select).not.toHaveProperty("senhaHash");
    expect(user).toMatchObject({ ativo: false });
  });

  it("registra a inativação na atividade de quem alterou", async () => {
    const db = mockDatabase({ ativo: true });

    await servicoUsuario.updateUserStatus(userId, editorId, false);

    expect(db.createAtividade).toHaveBeenCalledWith({
      data: {
        usuarioId: editorId,
        tipo: "EDICAO",
        descricao: "Inativou usuário Ana Silva do tipo Técnico.",
      },
    });
  });

  it("reativa o usuário e registra a reativação", async () => {
    const db = mockDatabase({ ativo: false, cargo: Cargo.GESTOR });

    await servicoUsuario.updateUserStatus(userId, editorId, true);

    expect(db.updateUsuario.mock.calls[0][0].data).toEqual({ ativo: true });
    expect(db.createAtividade).toHaveBeenCalledWith({
      data: {
        usuarioId: editorId,
        tipo: "EDICAO",
        descricao: "Reativou usuário Ana Silva do tipo Gestor.",
      },
    });
  });

  it("não grava nada quando o status já é o pedido", async () => {
    const db = mockDatabase({ ativo: false });

    const user = await servicoUsuario.updateUserStatus(userId, editorId, false);

    expect(user).toMatchObject({ id: userId, ativo: false });
    expect(db.updateUsuario).not.toHaveBeenCalled();
    expect(db.createAtividade).not.toHaveBeenCalled();
  });

  it("lança ErroUsuarioNaoEncontrado quando o usuário não existe", async () => {
    const db = mockDatabase(null);

    await expect(
      servicoUsuario.updateUserStatus(userId, editorId, false),
    ).rejects.toBeInstanceOf(ErroUsuarioNaoEncontrado);
    expect(db.updateUsuario).not.toHaveBeenCalled();
  });

  it("bloqueia a inativação da própria conta", async () => {
    const db = mockDatabase({ ativo: true });

    await expect(
      servicoUsuario.updateUserStatus(editorId, editorId, false),
    ).rejects.toBeInstanceOf(ErroAlterarProprioStatus);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
