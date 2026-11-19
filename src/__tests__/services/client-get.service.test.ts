import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { servicoCliente } from "@/services/cliente.service";

const clientId = "550e8400-e29b-41d4-a716-446655440100";

afterEach(() => vi.restoreAllMocks());

describe("ServicoCliente.listDetailed", () => {
  it("busca todos os clientes (sem filtrar ativo) ordenados por nome", async () => {
    const findMany = vi.spyOn(prisma.cliente, "findMany").mockResolvedValue([]);

    await servicoCliente.listDetailed();

    const args = findMany.mock.calls[0][0];
    expect(args?.where).toBeUndefined();
    expect(args?.orderBy).toEqual({ nome: "asc" });
    expect(args?.select).toMatchObject({
      cnpj: true,
      localizacao: true,
      ativo: true,
    });
  });
});

describe("ServicoCliente.getClientById", () => {
  it("busca pelo id com todos os campos", async () => {
    const findUnique = vi
      .spyOn(prisma.cliente, "findUnique")
      .mockResolvedValue({ id: clientId } as never);

    const client = await servicoCliente.getClientById(clientId);

    expect(client).toEqual({ id: clientId });
    const args = findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ id: clientId });
    expect(args.select).toMatchObject({ cnpj: true, localizacao: true });
  });

  it("devolve null quando não encontra", async () => {
    vi.spyOn(prisma.cliente, "findUnique").mockResolvedValue(null);

    expect(await servicoCliente.getClientById(clientId)).toBeNull();
  });
});
