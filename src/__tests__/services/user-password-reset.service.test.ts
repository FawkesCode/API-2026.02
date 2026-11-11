import { afterEach, describe, expect, it, vi } from "vitest";
import { compare } from "bcryptjs";
import { Cargo } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErroUsuarioInativo,
  ErroUsuarioNaoTecnico,
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
  return vi.spyOn(prisma.usuario, "update").mockImplementation(
    (async (args: { data: { senhaHash: string; senhaProvisoria: boolean } }) => ({
      id: userId,
      ...args.data,
    })) as never,
  );
}

describe("ServicoUsuario.redefinirSenhaDeTecnico", () => {
  it("salva o hash e marca a senha como provisória", async () => {
    const update = mockDatabase({ ativo: true, cargo: Cargo.TECNICO });

    await servicoUsuario.redefinirSenhaDeTecnico(userId, "NovaSenha@123");

    const data = update.mock.calls[0][0].data as {
      senhaHash: string;
      senhaProvisoria: boolean;
    };
    expect(data.senhaHash).not.toBe("NovaSenha@123");
    expect(await compare("NovaSenha@123", data.senhaHash)).toBe(true);
    expect(data.senhaProvisoria).toBe(true);
  });

  it("não altera a senha de um usuário inativo", async () => {
    const update = mockDatabase({ ativo: false, cargo: Cargo.TECNICO });

    await expect(
      servicoUsuario.redefinirSenhaDeTecnico(userId, "NovaSenha@123"),
    ).rejects.toBeInstanceOf(ErroUsuarioInativo);
    expect(update).not.toHaveBeenCalled();
  });

  it("restringe a redefinição a técnicos", async () => {
    const update = mockDatabase({ ativo: true, cargo: Cargo.GESTOR });

    await expect(
      servicoUsuario.redefinirSenhaDeTecnico(userId, "NovaSenha@123"),
    ).rejects.toBeInstanceOf(ErroUsuarioNaoTecnico);
    expect(update).not.toHaveBeenCalled();
  });
});
