import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ErroClienteNaoEncontrado,
  ErroClientePossuiProjetos,
  servicoCliente,
} from "@/services/cliente.service";

const clientId = "550e8400-e29b-41d4-a716-446655440100";

afterEach(() => vi.restoreAllMocks());

function mockDatabase(options?: { exists?: boolean; projects?: number }) {
  vi.spyOn(prisma, "$transaction").mockImplementation(((
    fn: (tx: typeof prisma) => unknown,
  ) => fn(prisma)) as never);
  vi.spyOn(prisma.cliente, "findUnique").mockResolvedValue(
    (options?.exists === false ? null : { id: clientId }) as never,
  );
  const countProjects = vi
    .spyOn(prisma.projeto, "count")
    .mockResolvedValue((options?.projects ?? 0) as never);
  const remove = vi.spyOn(prisma.cliente, "delete").mockResolvedValue({} as never);
  return { countProjects, remove };
}

describe("ServicoCliente.deleteClient", () => {
  it("exclui cliente sem projetos", async () => {
    const db = mockDatabase({ projects: 0 });

    await servicoCliente.deleteClient(clientId);

    expect(db.remove).toHaveBeenCalledWith({ where: { id: clientId } });
  });

  it("conta projetos ativos e inativos (sem filtrar ativo)", async () => {
    const db = mockDatabase();

    await servicoCliente.deleteClient(clientId);

    expect(db.countProjects.mock.calls[0][0]?.where).toEqual({ clienteId: clientId });
  });

  it("bloqueia cliente com projetos sem excluir", async () => {
    const db = mockDatabase({ projects: 1 });

    await expect(servicoCliente.deleteClient(clientId)).rejects.toBeInstanceOf(
      ErroClientePossuiProjetos,
    );
    expect(db.remove).not.toHaveBeenCalled();
  });

  it("rejeita cliente inexistente sem excluir", async () => {
    const db = mockDatabase({ exists: false });

    await expect(servicoCliente.deleteClient(clientId)).rejects.toBeInstanceOf(
      ErroClienteNaoEncontrado,
    );
    expect(db.countProjects).not.toHaveBeenCalled();
    expect(db.remove).not.toHaveBeenCalled();
  });
});
