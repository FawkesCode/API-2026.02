import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";

const data = {
  nome: "Acme Ltda",
  cnpj: "11222333000181",
  localizacao: "São Paulo - SP",
};

afterEach(() => vi.restoreAllMocks());

describe("ServicoCliente.createClient", () => {
  it("cria o cliente quando nome e CNPJ estão livres", async () => {
    vi.spyOn(prisma.cliente, "findFirst").mockResolvedValue(null);
    const create = vi
      .spyOn(prisma.cliente, "create")
      .mockResolvedValue({ id: "c1", ...data, ativo: true } as never);

    const client = await servicoCliente.createClient(data);

    expect(client).toMatchObject({ id: "c1", ativo: true });
    const args = create.mock.calls[0][0];
    expect(args.data).toEqual(data);
    expect(args.select).toMatchObject({ cnpj: true, localizacao: true });
  });

  it("procura duplicidade por CNPJ ou nome", async () => {
    const findFirst = vi.spyOn(prisma.cliente, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.cliente, "create").mockResolvedValue({} as never);

    await servicoCliente.createClient(data);

    expect(findFirst.mock.calls[0][0]?.where).toEqual({
      OR: [{ cnpj: data.cnpj }, { nome: data.nome }],
    });
  });

  it("rejeita CNPJ já cadastrado sem criar", async () => {
    vi.spyOn(prisma.cliente, "findFirst").mockResolvedValue({
      cnpj: data.cnpj,
    } as never);
    const create = vi.spyOn(prisma.cliente, "create");

    await expect(servicoCliente.createClient(data)).rejects.toBeInstanceOf(
      ErroCnpjJaCadastrado,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("rejeita nome já cadastrado sem criar", async () => {
    vi.spyOn(prisma.cliente, "findFirst").mockResolvedValue({
      cnpj: "99888777000161",
    } as never);
    const create = vi.spyOn(prisma.cliente, "create");

    await expect(servicoCliente.createClient(data)).rejects.toBeInstanceOf(
      ErroNomeClienteJaCadastrado,
    );
    expect(create).not.toHaveBeenCalled();
  });
});
