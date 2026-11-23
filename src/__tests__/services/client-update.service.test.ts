import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ErroClienteNaoEncontrado,
  ErroClientePossuiProjetosAtivos,
  ErroCnpjJaCadastrado,
  ErroNomeClienteJaCadastrado,
  servicoCliente,
} from "@/services/cliente.service";

const clientId = "550e8400-e29b-41d4-a716-446655440100";

afterEach(() => vi.restoreAllMocks());

function mockDatabase(options?: {
  exists?: boolean;
  duplicate?: { cnpj: string } | null;
  activeProjects?: number;
}) {
  const countProjects = vi
    .spyOn(prisma.projeto, "count")
    .mockResolvedValue((options?.activeProjects ?? 0) as never);
  vi.spyOn(prisma, "$transaction").mockImplementation(((
    fn: (tx: typeof prisma) => unknown,
  ) => fn(prisma)) as never);
  vi.spyOn(prisma.cliente, "findUnique").mockResolvedValue(
    (options?.exists === false ? null : { id: clientId }) as never,
  );
  const findFirst = vi
    .spyOn(prisma.cliente, "findFirst")
    .mockResolvedValue((options?.duplicate ?? null) as never);
  const update = vi
    .spyOn(prisma.cliente, "update")
    .mockImplementation((async (args: { data: Record<string, unknown> }) => ({
      id: clientId,
      ...args.data,
    })) as never);
  return { findFirst, update, countProjects };
}

describe("ServicoCliente.updateClient", () => {
  it("grava só os campos enviados", async () => {
    const db = mockDatabase();

    const client = await servicoCliente.updateClient(clientId, {
      localizacao: "Rio de Janeiro - RJ",
    });

    expect(client).toMatchObject({ localizacao: "Rio de Janeiro - RJ" });
    const args = db.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: clientId });
    expect(args.data).toEqual({ localizacao: "Rio de Janeiro - RJ" });
  });

  it("não procura duplicidade quando nome e CNPJ não mudam", async () => {
    const db = mockDatabase();

    await servicoCliente.updateClient(clientId, { ativo: false });

    expect(db.findFirst).not.toHaveBeenCalled();
    expect(db.update.mock.calls[0][0].data).toEqual({ ativo: false });
  });

  it("procura duplicidade em outros clientes, ignorando o próprio", async () => {
    const db = mockDatabase();

    await servicoCliente.updateClient(clientId, {
      nome: "Acme",
      cnpj: "11222333000181",
    });

    expect(db.findFirst.mock.calls[0][0]?.where).toEqual({
      id: { not: clientId },
      OR: [{ cnpj: "11222333000181" }, { nome: "Acme" }],
    });
  });

  it("rejeita cliente inexistente sem atualizar", async () => {
    const db = mockDatabase({ exists: false });

    await expect(
      servicoCliente.updateClient(clientId, { nome: "Acme" }),
    ).rejects.toBeInstanceOf(ErroClienteNaoEncontrado);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejeita CNPJ de outro cliente", async () => {
    const db = mockDatabase({ duplicate: { cnpj: "11222333000181" } });

    await expect(
      servicoCliente.updateClient(clientId, { cnpj: "11222333000181" }),
    ).rejects.toBeInstanceOf(ErroCnpjJaCadastrado);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("inativa quando o cliente não tem projetos ativos", async () => {
    const db = mockDatabase({ activeProjects: 0 });

    await servicoCliente.updateClient(clientId, { ativo: false });

    expect(db.countProjects.mock.calls[0][0]?.where).toEqual({
      clienteId: clientId,
      ativo: true,
    });
    expect(db.update.mock.calls[0][0].data).toEqual({ ativo: false });
  });

  it("bloqueia inativação com projetos ativos sem atualizar", async () => {
    const db = mockDatabase({ activeProjects: 2 });

    await expect(
      servicoCliente.updateClient(clientId, { ativo: false, nome: "Acme" }),
    ).rejects.toBeInstanceOf(ErroClientePossuiProjetosAtivos);
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    ["reativação", { ativo: true }],
    ["edição sem ativo", { nome: "Acme" }],
  ])("não confere projetos na %s", async (_case, data) => {
    const db = mockDatabase({ activeProjects: 2 });

    await servicoCliente.updateClient(clientId, data);

    expect(db.countProjects).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it("rejeita nome de outro cliente", async () => {
    const db = mockDatabase({ duplicate: { cnpj: "45016372000144" } });

    await expect(
      servicoCliente.updateClient(clientId, { nome: "Acme" }),
    ).rejects.toBeInstanceOf(ErroNomeClienteJaCadastrado);
    expect(db.update).not.toHaveBeenCalled();
  });
});
