import { afterEach, describe, expect, it, vi } from "vitest";
import { Cargo } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErroAlterarProprioCargo,
  ErroUsuarioNaoEncontrado,
  servicoUsuario,
} from "@/services/usuario.service";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const editorId = "550e8400-e29b-41d4-a716-446655440002";
const oldTeamId = "550e8400-e29b-41d4-a716-446655440030";
const newTeamId = "550e8400-e29b-41d4-a716-446655440031";

afterEach(() => vi.restoreAllMocks());

function mockDatabase(current: { cargo: Cargo; equipeId?: string | null } | null) {
  vi.spyOn(prisma, "$transaction").mockImplementation(((
    fn: (tx: typeof prisma) => unknown,
  ) => fn(prisma)) as never);
  vi.spyOn(prisma.usuario, "findUnique").mockResolvedValue(
    (current ? { id: userId, ...current } : null) as never,
  );
  const updateUsuario = vi
    .spyOn(prisma.usuario, "update")
    .mockImplementation((async (args: { data: Record<string, unknown> }) => ({
      id: userId,
      ...args.data,
    })) as never);
  const findEquipe = vi
    .spyOn(prisma.equipe, "findUnique")
    .mockResolvedValue(null as never);
  const createEquipe = vi
    .spyOn(prisma.equipe, "create")
    .mockResolvedValue({ id: newTeamId } as never);
  const createAtividade = vi
    .spyOn(prisma.atividadeConta, "create")
    .mockResolvedValue({} as never);
  return { updateUsuario, findEquipe, createEquipe, createAtividade };
}

const data = { nome: "Ana Silva", email: "ana@example.com" };

describe("ServicoUsuario.updateUser", () => {
  it("atualiza sem mexer em equipe quando o cargo não muda", async () => {
    const db = mockDatabase({ cargo: Cargo.TECNICO, equipeId: oldTeamId });

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.TECNICO,
    });

    const args = db.updateUsuario.mock.calls[0][0];
    expect(args.where).toEqual({ id: userId });
    expect(args.data).toEqual({ ...data, cargo: Cargo.TECNICO });
    expect(args.select).not.toHaveProperty("senhaHash");
    expect(db.createEquipe).not.toHaveBeenCalled();
  });

  it("nunca envia senha para o banco", async () => {
    const db = mockDatabase({ cargo: Cargo.TECNICO });

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.TECNICO,
    });

    const args = db.updateUsuario.mock.calls[0][0];
    expect(args.data).not.toHaveProperty("senhaHash");
    expect(args.data).not.toHaveProperty("senhaProvisoria");
  });

  it("cria equipe própria quando o usuário vira GESTOR", async () => {
    const db = mockDatabase({ cargo: Cargo.TECNICO, equipeId: oldTeamId });

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.GESTOR,
    });

    expect(db.createEquipe).toHaveBeenCalledWith({
      data: {
        nome: "Equipe Ana Silva",
        descricao: "Equipe gerenciada por Ana Silva.",
      },
      select: { id: true },
    });
    expect(db.updateUsuario.mock.calls[0][0].data).toMatchObject({
      cargo: Cargo.GESTOR,
      equipeId: newTeamId,
    });
    expect(db.createAtividade).toHaveBeenCalledWith({
      data: {
        usuarioId: userId,
        tipo: "EQUIPE",
        descricao: "Equipe Equipe Ana Silva criada automaticamente para sua conta.",
      },
    });
  });

  it("acrescenta sufixo quando já existe equipe com o nome", async () => {
    const db = mockDatabase({ cargo: Cargo.TECNICO });
    db.findEquipe.mockImplementation((async (args: {
      where: { nome: string };
    }) => (args.where.nome === "Equipe Ana Silva" ? { id: "x" } : null)) as never);

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.GESTOR,
    });

    expect(db.createEquipe.mock.calls[0][0].data.nome).toBe(
      "Equipe Ana Silva (2)",
    );
  });

  it("tira o usuário da equipe quando deixa de ser GESTOR", async () => {
    const db = mockDatabase({ cargo: Cargo.GESTOR, equipeId: oldTeamId });

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.TECNICO,
    });

    expect(db.updateUsuario.mock.calls[0][0].data).toMatchObject({
      cargo: Cargo.TECNICO,
      equipeId: null,
    });
    expect(db.createEquipe).not.toHaveBeenCalled();
  });

  it("registra a edição na atividade de quem editou", async () => {
    const db = mockDatabase({ cargo: Cargo.TECNICO });

    await servicoUsuario.updateUser(userId, editorId, {
      ...data,
      cargo: Cargo.TECNICO,
    });

    expect(db.createAtividade).toHaveBeenCalledWith({
      data: {
        usuarioId: editorId,
        tipo: "EDICAO",
        descricao: "Editou usuário Ana Silva do tipo Técnico.",
      },
    });
  });

  it("lança ErroUsuarioNaoEncontrado quando o usuário não existe", async () => {
    const db = mockDatabase(null);

    await expect(
      servicoUsuario.updateUser(userId, editorId, {
        ...data,
        cargo: Cargo.TECNICO,
      }),
    ).rejects.toBeInstanceOf(ErroUsuarioNaoEncontrado);
    expect(db.updateUsuario).not.toHaveBeenCalled();
  });

  it("bloqueia a troca do próprio cargo", async () => {
    const db = mockDatabase({ cargo: Cargo.SUPORTE_INTERNO });

    await expect(
      servicoUsuario.updateUser(editorId, editorId, {
        ...data,
        cargo: Cargo.TECNICO,
      }),
    ).rejects.toBeInstanceOf(ErroAlterarProprioCargo);
    expect(db.updateUsuario).not.toHaveBeenCalled();
  });

  it("permite editar a própria conta mantendo o cargo", async () => {
    const db = mockDatabase({ cargo: Cargo.SUPORTE_INTERNO });

    await servicoUsuario.updateUser(editorId, editorId, {
      ...data,
      cargo: Cargo.SUPORTE_INTERNO,
    });

    expect(db.updateUsuario).toHaveBeenCalled();
  });
});
