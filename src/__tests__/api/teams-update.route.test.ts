import { afterEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/equipes/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import {
  ErroEquipeNaoEncontrada,
  ErroEquipeSemPermissao,
  ErroNomeEquipeDuplicado,
  ErroTecnicosInvalidos,
  servicoEquipe,
} from "@/services/equipe.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const teamId = "550e8400-e29b-41d4-a716-446655440000";
const technicianId = "550e8400-e29b-41d4-a716-446655440001";
const managerId = "550e8400-e29b-41d4-a716-446655440002";
const updatedTeam = {
  id: teamId,
  nome: "Equipe Norte",
  descricao: "Atende a região norte",
};

function patch(body: unknown, options?: { authenticated?: boolean; id?: string }) {
  const id = options?.id ?? teamId;
  const token = criarTokenDeSessao({
    usuarioId: managerId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return PATCH(
    new Request(`http://localhost/api/equipes/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...(options?.authenticated === false
          ? {}
          : { authorization: `Bearer ${token}` }),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

afterEach(() => vi.restoreAllMocks());

describe("PATCH /api/equipes/:id", () => {
  it("aceita o corpo completo enviado pelo modal de edição", async () => {
    const atualizar = vi
      .spyOn(servicoEquipe, "atualizar")
      .mockResolvedValue(updatedTeam);

    const response = await patch({
      nome: "  Equipe Norte  ",
      descricao: "Atende a região norte",
      tecnicosIds: [technicianId],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updatedTeam);
    expect(atualizar).toHaveBeenCalledWith(teamId, managerId, {
      nome: "Equipe Norte",
      descricao: "Atende a região norte",
      tecnicosIds: [technicianId],
    });
  });

  it("repassa só os campos enviados (PATCH parcial)", async () => {
    const atualizar = vi
      .spyOn(servicoEquipe, "atualizar")
      .mockResolvedValue(updatedTeam);

    const response = await patch({ descricao: "Só a descrição" });

    expect(response.status).toBe(200);
    expect(atualizar).toHaveBeenCalledWith(teamId, managerId, {
      nome: undefined,
      descricao: "Só a descrição",
      tecnicosIds: undefined,
    });
  });

  it("salva descrição vazia como null", async () => {
    const atualizar = vi
      .spyOn(servicoEquipe, "atualizar")
      .mockResolvedValue(updatedTeam);

    await patch({ descricao: "   " });

    expect(atualizar).toHaveBeenCalledWith(
      teamId,
      managerId,
      expect.objectContaining({ descricao: null }),
    );
  });

  it("retorna 401 sem sessão, sem chamar o serviço", async () => {
    const atualizar = vi.spyOn(servicoEquipe, "atualizar");
    const response = await patch({ nome: "X" }, { authenticated: false });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      erro: "Não autenticado.",
      codigo: "NAO_AUTENTICADO",
    });
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("retorna 400 para id que não é UUID", async () => {
    const response = await patch({ nome: "X" }, { id: "abc" });

    expect(response.status).toBe(400);
    expect((await response.json()).codigo).toBe("ID_INVALIDO");
  });

  it("retorna 400 para JSON inválido", async () => {
    const response = await patch("{nome:");

    expect(response.status).toBe(400);
    expect((await response.json()).codigo).toBe("JSON_INVALIDO");
  });

  it.each([
    ["corpo vazio", {}, "Informe ao menos um campo: nome, descricao ou tecnicosIds."],
    ["nome vazio", { nome: "   " }, "Informe o nome da equipe."],
    ["nome longo", { nome: "a".repeat(101) }, "O nome deve ter no máximo 100 caracteres."],
    ["técnico com id inválido", { tecnicosIds: ["abc"] }, "Cada tecnicosIds deve ser um UUID válido."],
    [
      "campo não editável",
      { ativo: false },
      "Campo não editável. Envie apenas nome, descricao e/ou tecnicosIds.",
    ],
  ])("retorna 400 com mensagem legível para %s", async (_caso, body, mensagem) => {
    const atualizar = vi.spyOn(servicoEquipe, "atualizar");
    const response = await patch(body);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.codigo).toBe("DADOS_INVALIDOS");
    expect(json.erro).toBe(mensagem);
    expect(atualizar).not.toHaveBeenCalled();
  });

  it.each([
    [new ErroEquipeNaoEncontrada(), 404, "EQUIPE_NAO_ENCONTRADA"],
    [new ErroEquipeSemPermissao(), 403, "SEM_PERMISSAO"],
    [new ErroNomeEquipeDuplicado(), 400, "NOME_EQUIPE_EM_USO"],
    [new ErroTecnicosInvalidos(), 409, "TECNICOS_INVALIDOS"],
  ])("traduz %s para %i", async (error, status, codigo) => {
    vi.spyOn(servicoEquipe, "atualizar").mockRejectedValue(error);
    const response = await patch({ nome: "X" });

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ erro: error.message, codigo });
  });

  it("retorna 500 no formato padrão para erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoEquipe, "atualizar").mockRejectedValue(new Error("db"));
    const response = await patch({ nome: "X" });

    expect(response.status).toBe(500);
    expect((await response.json()).codigo).toBe("ERRO_INTERNO");
  });
});
