import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { servicoUsuario } from "@/services/usuario.service";

afterEach(() => vi.restoreAllMocks());

describe("ServicoUsuario.listDetailed", () => {
  it("lista ativos e inativos ordenados por nome, sem selecionar senhaHash", async () => {
    const findMany = vi
      .spyOn(prisma.usuario, "findMany")
      .mockResolvedValue([] as never);

    await servicoUsuario.listDetailed();

    const args = findMany.mock.calls[0][0]!;
    expect(args.where).toBeUndefined();
    expect(args.orderBy).toEqual({ nome: "asc" });
    expect(args.select).toEqual({
      id: true,
      nome: true,
      email: true,
      cargo: true,
      ativo: true,
      senhaProvisoria: true,
      equipe: { select: { nome: true } },
    });
  });
});
