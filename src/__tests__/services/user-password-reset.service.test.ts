import { afterEach, describe, expect, it, vi } from "vitest";
import { compare } from "bcryptjs";
import { Cargo } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErroUsuarioInativo,
  servicoUsuario,
} from "@/services/usuario.service";

const userId = "550e8400-e29b-41d4-a716-446655440010";

afterEach(() => vi.restoreAllMocks());

function mockDatabase(user: { ativo: boolean; cargo: Cargo }) {
  vi.spyOn(prisma, "$transaction").mockImplementation(
    ((fn: (tx: typeof prisma) => unknown) => fn(prisma)) as never,
  );
  vi.spyOn(prisma.usuario, "findUnique").mockResolvedValue({
    id: userId,
    ...user,
  } as never);
  return vi.spyOn(prisma.usuario, "updateMany").mockResolvedValue({
    count: 1,
  } as never);
}

describe("ServicoUsuario.redefinirSenhaDeUsuario", () => {
  it("salva o hash e marca a senha como provisória", async () => {
    const update = mockDatabase({ ativo: true, cargo: Cargo.TECNICO });

    await servicoUsuario.redefinirSenhaDeUsuario(userId, "NovaSenha@123");

    const args = update.mock.calls[0][0];
    const data = args.data as { senhaHash: string; senhaProvisoria: boolean };
    expect(args.where).toEqual({ id: userId, ativo: true });
    expect(data.senhaHash).not.toBe("NovaSenha@123");
    expect(await compare("NovaSenha@123", data.senhaHash)).toBe(true);
    expect(data.senhaProvisoria).toBe(true);
  });

  it("não altera a senha de um usuário inativo", async () => {
    const update = mockDatabase({ ativo: false, cargo: Cargo.TECNICO });

    await expect(
      servicoUsuario.redefinirSenhaDeUsuario(userId, "NovaSenha@123"),
    ).rejects.toBeInstanceOf(ErroUsuarioInativo);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    Cargo.TECNICO,
    Cargo.GESTOR,
    Cargo.SUPORTE,
    Cargo.SUPORTE_INTERNO,
    Cargo.COMERCIAL,
  ])("redefine a senha de um usuário com cargo %s", async (cargo) => {
    const update = mockDatabase({ ativo: true, cargo });

    await expect(
      servicoUsuario.redefinirSenhaDeUsuario(userId, "NovaSenha@123"),
    ).resolves.toEqual({ id: userId });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("não altera a senha se o usuário for inativado durante a transação", async () => {
    vi.spyOn(prisma, "$transaction").mockImplementation(
      ((fn: (tx: typeof prisma) => unknown) => fn(prisma)) as never,
    );
    vi.spyOn(prisma.usuario, "findUnique")
      .mockResolvedValueOnce({
        id: userId,
        ativo: true,
        cargo: Cargo.TECNICO,
      } as never)
      .mockResolvedValueOnce({
        ativo: false,
        cargo: Cargo.TECNICO,
      } as never);
    const update = vi.spyOn(prisma.usuario, "updateMany").mockResolvedValue({
      count: 0,
    } as never);

    await expect(
      servicoUsuario.redefinirSenhaDeUsuario(userId, "NovaSenha@123"),
    ).rejects.toBeInstanceOf(ErroUsuarioInativo);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId, ativo: true },
      }),
    );
  });
});
