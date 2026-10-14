import { afterEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/equipes/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  servicoEquipe,
  TeamNameInUseError,
  UnauthorizedTeamEditError,
} from "@/services/equipe.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const teamId = "550e8400-e29b-41d4-a716-446655440003";
const managerId = "550e8400-e29b-41d4-a716-446655440002";
const updatedTeam = {
  id: teamId,
  nome: "Equipe Norte",
  descricao: "Atende a região norte",
  ativo: true,
};

function request(corpo: unknown, authenticated = true, id = teamId) {
  const token = criarTokenDeSessao({
    usuarioId: managerId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return PATCH(
    new Request(`http://localhost/api/equipes/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
      },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
    { params: Promise.resolve({ id }) },
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PATCH /api/equipes/:id", () => {
  it("retorna 200 com a equipe atualizada e repassa o usuário da sessão", async () => {
    const update = vi
      .spyOn(servicoEquipe, "update")
      .mockResolvedValue(updatedTeam);
    const resposta = await request({ nome: "  Equipe Norte  " });

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual(updatedTeam);
    expect(update).toHaveBeenCalledWith(teamId, {
      nome: "Equipe Norte",
      usuarioId: managerId,
    });
  });

  it("envia só a descrição sem incluir nome", async () => {
    const update = vi
      .spyOn(servicoEquipe, "update")
      .mockResolvedValue(updatedTeam);

    await request({ descricao: "Nova descrição" });

    expect(update).toHaveBeenCalledWith(teamId, {
      descricao: "Nova descrição",
      usuarioId: managerId,
    });
  });

  it("retorna 401 sem sessão", async () => {
    const update = vi.spyOn(servicoEquipe, "update");
    const resposta = await request({ nome: "X" }, false);

    expect(resposta.status).toBe(401);
    expect((await resposta.json()).codigo).toBe("NAO_AUTENTICADO");
    expect(update).not.toHaveBeenCalled();
  });

  it("retorna 400 para id que não é UUID", async () => {
    const resposta = await request({ nome: "X" }, true, "abc");

    expect(resposta.status).toBe(400);
    expect((await resposta.json()).codigo).toBe("ID_INVALIDO");
  });

  it("retorna 400 para JSON inválido", async () => {
    const resposta = await request("{nome:");

    expect(resposta.status).toBe(400);
    expect((await resposta.json()).codigo).toBe("JSON_INVALIDO");
  });

  it.each([
    ["corpo vazio", {}],
    ["nome vazio", { nome: "   " }],
    ["nome longo", { nome: "a".repeat(101) }],
    ["campo não editável", { ativo: false }],
  ])("retorna 400 para %s", async (_caso, corpo) => {
    const update = vi.spyOn(servicoEquipe, "update");
    const resposta = await request(corpo);

    expect(resposta.status).toBe(400);
    expect((await resposta.json()).codigo).toBe("DADOS_INVALIDOS");
    expect(update).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a equipe não existe", async () => {
    vi.spyOn(servicoEquipe, "update").mockResolvedValue(null);
    const resposta = await request({ nome: "X" });

    expect(resposta.status).toBe(404);
    expect((await resposta.json()).codigo).toBe("EQUIPE_NAO_ENCONTRADA");
  });

  it("retorna 403 quando não é o gestor da equipe", async () => {
    vi.spyOn(servicoEquipe, "update").mockRejectedValue(
      new UnauthorizedTeamEditError(),
    );
    const resposta = await request({ nome: "X" });

    expect(resposta.status).toBe(403);
    expect((await resposta.json()).codigo).toBe("SEM_PERMISSAO");
  });

  it.each([
    ["checagem do service", new TeamNameInUseError()],
    [
      "violação de unique (P2002)",
      new Prisma.PrismaClientKnownRequestError("unique", {
        code: "P2002",
        clientVersion: "7",
      }),
    ],
  ])("retorna 400 quando o nome já está em uso (%s)", async (_caso, erro) => {
    vi.spyOn(servicoEquipe, "update").mockRejectedValue(erro);
    const resposta = await request({ nome: "Equipe Massa" });

    expect(resposta.status).toBe(400);
    expect((await resposta.json()).codigo).toBe("NOME_EQUIPE_EM_USO");
  });

  it("retorna 500 no formato padrão para erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoEquipe, "update").mockRejectedValue(new Error("db"));
    const resposta = await request({ nome: "X" });

    expect(resposta.status).toBe(500);
    expect((await resposta.json()).codigo).toBe("ERRO_INTERNO");
  });
});
