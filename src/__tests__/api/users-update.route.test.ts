import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/lib/generated/prisma/client";
import { PUT } from "@/app/api/usuarios/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import {
  ErroAlterarProprioCargo,
  ErroUsuarioNaoEncontrado,
  servicoUsuario,
} from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const suporteId = "550e8400-e29b-41d4-a716-446655440002";
const validData = {
  nome: "Ana Silva",
  email: "ana@example.com",
  cargo: "GESTOR",
} as const;
const updatedUser = {
  id: userId,
  ...validData,
  ativo: true,
  senhaProvisoria: false,
  equipeId: null,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
  atualizadoEm: new Date("2026-01-02T00:00:00.000Z"),
};

function put(
  body: unknown,
  options?: { authenticated?: boolean; id?: string },
) {
  const id = options?.id ?? userId;
  const token = criarTokenDeSessao({
    usuarioId: suporteId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return PUT(
    new Request(`http://localhost/api/usuarios/${id}`, {
      method: "PUT",
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

describe("PUT /api/usuarios/:id", () => {
  it("edita nome, email e cargo e devolve o usuário sem senha", async () => {
    const updateUser = vi
      .spyOn(servicoUsuario, "updateUser")
      .mockResolvedValue(updatedUser);

    const response = await put({ ...validData, nome: "  Ana Silva  " });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: userId, nome: "Ana Silva" });
    expect(body).not.toHaveProperty("senhaHash");
    expect(updateUser).toHaveBeenCalledWith(userId, suporteId, validData);
  });

  it("ignora senha enviada no corpo", async () => {
    const updateUser = vi
      .spyOn(servicoUsuario, "updateUser")
      .mockResolvedValue(updatedUser);

    const response = await put({ ...validData, senha: "Outra@123" });

    expect(response.status).toBe(200);
    expect(updateUser.mock.calls[0][2]).not.toHaveProperty("senha");
  });

  it("responde 400 para id inválido", async () => {
    const response = await put(validData, { id: "abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
  });

  it("exige sessão", async () => {
    const response = await put(validData, { authenticated: false });

    expect(response.status).toBe(401);
  });

  it("bloqueia quem não é SUPORTE_INTERNO", async () => {
    vi.restoreAllMocks();
    mockSession("GESTOR");
    const updateUser = vi.spyOn(servicoUsuario, "updateUser");

    const response = await put(validData);

    expect(response.status).toBe(403);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("responde 400 para JSON inválido", async () => {
    const response = await put("{nome");

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "JSON_INVALIDO" });
  });

  it.each([
    ["email com formato inválido", { ...validData, email: "nao-e-email" }],
    ["nome vazio", { ...validData, nome: "   " }],
    ["cargo inexistente", { ...validData, cargo: "CHEFE" }],
    ["campo obrigatório ausente", { nome: "Ana", email: "ana@example.com" }],
  ])("responde 400 para %s", async (_, body) => {
    const updateUser = vi.spyOn(servicoUsuario, "updateUser");

    const response = await put(body);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "DADOS_INVALIDOS" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("responde 400 quando o email já pertence a outra conta", async () => {
    vi.spyOn(servicoUsuario, "updateUser").mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicado", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await put(validData);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "EMAIL_JA_CADASTRADO",
      detalhes: { email: ["Este e-mail já está cadastrado."] },
    });
  });

  it("responde 404 quando o usuário não existe", async () => {
    vi.spyOn(servicoUsuario, "updateUser").mockRejectedValue(
      new ErroUsuarioNaoEncontrado(),
    );

    const response = await put(validData);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      codigo: "USUARIO_NAO_ENCONTRADO",
    });
  });

  it("responde 400 ao tentar alterar o próprio cargo", async () => {
    vi.spyOn(servicoUsuario, "updateUser").mockRejectedValue(
      new ErroAlterarProprioCargo(),
    );

    const response = await put(validData, { id: suporteId });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "ALTERAR_PROPRIO_CARGO",
    });
  });

  it("responde 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoUsuario, "updateUser").mockRejectedValue(new Error("x"));

    const response = await put(validData);

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});
