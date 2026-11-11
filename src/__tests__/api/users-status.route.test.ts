import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/usuarios/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import {
  ErroAlterarProprioStatus,
  ErroUsuarioNaoEncontrado,
  servicoUsuario,
} from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const suporteId = "550e8400-e29b-41d4-a716-446655440002";
const updatedUser = {
  id: userId,
  nome: "Ana Silva",
  email: "ana@example.com",
  cargo: "TECNICO",
  ativo: false,
  senhaProvisoria: false,
  equipeId: null,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-02T00:00:00.000Z"),
} as const;

function patch(
  body: unknown,
  options?: { authenticated?: boolean; id?: string },
) {
  const id = options?.id ?? userId;
  const token = criarTokenDeSessao({
    usuarioId: suporteId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return PATCH(
    new Request(`http://localhost/api/usuarios/${id}`, {
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

function mockSession(cargo: "SUPORTE_INTERNO" | "GESTOR" = "SUPORTE_INTERNO") {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: suporteId,
    nome: "Suporte",
    email: "suporte@example.com",
    cargo,
    ativo: true,
    equipeId: null,
    equipe: null,
    criadoEm: new Date(),
  } as never);
}

beforeEach(() => mockSession());
afterEach(() => vi.restoreAllMocks());

describe("PATCH /api/usuarios/:id", () => {
  it("inativa o usuário e devolve os dados sem senha", async () => {
    const updateStatus = vi
      .spyOn(servicoUsuario, "updateUserStatus")
      .mockResolvedValue(updatedUser as never);

    const response = await patch({ ativo: false });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: userId, ativo: false });
    expect(body).not.toHaveProperty("senhaHash");
    expect(updateStatus).toHaveBeenCalledWith(userId, suporteId, false);
  });

  it("reativa o usuário", async () => {
    const updateStatus = vi
      .spyOn(servicoUsuario, "updateUserStatus")
      .mockResolvedValue({ ...updatedUser, ativo: true } as never);

    const response = await patch({ ativo: true });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ativo: true });
    expect(updateStatus).toHaveBeenCalledWith(userId, suporteId, true);
  });

  it("ignora campos além de ativo", async () => {
    const updateStatus = vi
      .spyOn(servicoUsuario, "updateUserStatus")
      .mockResolvedValue(updatedUser as never);

    await patch({ ativo: false, cargo: "GESTOR", nome: "Outro" });

    expect(updateStatus).toHaveBeenCalledWith(userId, suporteId, false);
  });

  it("responde 400 para id inválido", async () => {
    const response = await patch({ ativo: false }, { id: "abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
  });

  it("exige sessão", async () => {
    const response = await patch({ ativo: false }, { authenticated: false });

    expect(response.status).toBe(401);
  });

  it("bloqueia quem não é SUPORTE_INTERNO", async () => {
    vi.restoreAllMocks();
    mockSession("GESTOR");
    const updateStatus = vi.spyOn(servicoUsuario, "updateUserStatus");

    const response = await patch({ ativo: false });

    expect(response.status).toBe(403);
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it("responde 400 para JSON inválido", async () => {
    const response = await patch("{ativo");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "JSON_INVALIDO" });
  });

  it.each([
    ["ativo ausente", {}],
    ["ativo como string", { ativo: "false" }],
    ["ativo como número", { ativo: 0 }],
    ["ativo nulo", { ativo: null }],
  ])("responde 400 para %s", async (_, body) => {
    const updateStatus = vi.spyOn(servicoUsuario, "updateUserStatus");

    const response = await patch(body);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json).toMatchObject({ codigo: "DADOS_INVALIDOS" });
    expect(json.detalhes).toHaveProperty("ativo");
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it("responde 404 quando o usuário não existe", async () => {
    vi.spyOn(servicoUsuario, "updateUserStatus").mockRejectedValue(
      new ErroUsuarioNaoEncontrado(),
    );

    const response = await patch({ ativo: false });

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      codigo: "USUARIO_NAO_ENCONTRADO",
    });
  });

  it("responde 400 ao tentar inativar a própria conta", async () => {
    vi.spyOn(servicoUsuario, "updateUserStatus").mockRejectedValue(
      new ErroAlterarProprioStatus(),
    );

    const response = await patch({ ativo: false }, { id: suporteId });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "ALTERAR_PROPRIO_STATUS",
    });
  });

  it("responde 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoUsuario, "updateUserStatus").mockRejectedValue(
      new Error("x"),
    );

    const response = await patch({ ativo: false });

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});
