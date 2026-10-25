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

describe("ServicoUsuario.createUser", () => {
  const equipeCriadaId = "550e8400-e29b-41d4-a716-446655440020";
  const suporteId = "550e8400-e29b-41d4-a716-446655440021";

  function mockTransacao({ nomesOcupados = [] as string[] } = {}) {
    vi.spyOn(prisma, "$transaction").mockImplementation(((
      fn: (tx: typeof prisma) => unknown,
    ) => fn(prisma)) as never);
    const findEquipe = vi
      .spyOn(prisma.equipe, "findUnique")
      .mockImplementation((async (args: { where: { nome: string } }) =>
        nomesOcupados.includes(args.where.nome) ? { id: "ocupada" } : null) as never);
    const createEquipe = vi
      .spyOn(prisma.equipe, "create")
      .mockResolvedValue({ id: equipeCriadaId } as never);
    const createUsuario = vi
      .spyOn(prisma.usuario, "create")
      .mockImplementation((async (args: { data: Record<string, unknown> }) => ({
        id: "550e8400-e29b-41d4-a716-446655440022",
        ...args.data,
      })) as never);
    const createAtividade = vi
      .spyOn(prisma.atividadeConta, "create")
      .mockResolvedValue({} as never);
    return { findEquipe, createEquipe, createUsuario, createAtividade };
  }

  const dadosGestor = {
    nome: "Ana Gestora",
    email: "ana@example.com",
    cargo: "GESTOR" as const,
    password: "Senha@123",
    criadoPorId: suporteId,
  };

  it("cria uma equipe própria e vincula o gestor a ela", async () => {
    const { createEquipe, createUsuario, createAtividade } = mockTransacao();

    const gestor = await servicoUsuario.createUser(dadosGestor);

    expect(createEquipe).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nome: "Equipe Ana Gestora" }),
      }),
    );
    expect(createUsuario.mock.calls[0][0].data).toMatchObject({
      cargo: "GESTOR",
      equipeId: equipeCriadaId,
      senhaProvisoria: true,
    });
    expect(gestor.equipeId).toBe(equipeCriadaId);
    expect(createAtividade).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: gestor.id, tipo: "EQUIPE" }),
    });
    expect(createAtividade).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuarioId: suporteId, tipo: "CADASTRO" }),
    });
  });

  it("acrescenta um sufixo quando já existe equipe com o mesmo nome", async () => {
    const { createEquipe } = mockTransacao({
      nomesOcupados: ["Equipe Ana Gestora", "Equipe Ana Gestora (2)"],
    });

    await servicoUsuario.createUser(dadosGestor);

    expect(createEquipe.mock.calls[0][0].data.nome).toBe(
      "Equipe Ana Gestora (3)",
    );
  });

  it.each(["TECNICO", "SUPORTE", "SUPORTE_INTERNO", "COMERCIAL"] as const)(
    "não cria equipe para %s",
    async (cargo) => {
      const { createEquipe, createUsuario } = mockTransacao();

      await servicoUsuario.createUser({ ...dadosGestor, cargo });

      expect(createEquipe).not.toHaveBeenCalled();
      expect(createUsuario.mock.calls[0][0].data).toMatchObject({
        cargo,
        equipeId: null,
      });
    },
  );
});
