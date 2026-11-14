import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/usuarios/[id]/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const suporteId = "550e8400-e29b-41d4-a716-446655440002";

const sessionUser = (cargo: "SUPORTE_INTERNO" | "GESTOR") => ({
  id: suporteId,
  nome: "Suporte",
  email: "suporte@example.com",
  cargo,
  ativo: true,
  equipeId: null,
  equipe: null,
  criadoEm: new Date(),
});

const targetUser = {
  id: userId,
  nome: "Ana Silva",
  email: "ana@example.com",
  cargo: "TECNICO",
  ativo: false,
  equipeId: null,
  equipe: null,
  criadoEm: new Date("2026-01-01T00:00:00.000Z"),
};

function get(options?: { authenticated?: boolean; id?: string }) {
  const id = options?.id ?? userId;
  const token = criarTokenDeSessao({
    usuarioId: suporteId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return GET(
    new Request(`http://localhost/api/usuarios/${id}`, {
      headers:
        options?.authenticated === false
          ? {}
          : { authorization: `Bearer ${token}` },
    }),
    { params: Promise.resolve({ id }) },
  );
}

/** 1ª chamada = usuário da sessão (exigirCargo); 2ª = usuário consultado. */
function mockLookups(
  cargo: "SUPORTE_INTERNO" | "GESTOR",
  target: typeof targetUser | null = targetUser,
) {
  return vi
    .spyOn(servicoUsuario, "buscarPorId")
    .mockResolvedValueOnce(sessionUser(cargo) as never)
    .mockResolvedValueOnce(target as never);
}

afterEach(() => vi.restoreAllMocks());

describe("GET /api/usuarios/:id", () => {
  it("devolve o usuário com o status atual e sem senha", async () => {
    const lookup = mockLookups("SUPORTE_INTERNO");

    const response = await get();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: userId, ativo: false });
    expect(body).not.toHaveProperty("senhaHash");
    expect(lookup).toHaveBeenLastCalledWith(userId);
  });

  it("responde 400 para id inválido", async () => {
    const response = await get({ id: "abc" });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "ID_INVALIDO" });
  });

  it("exige sessão", async () => {
    const response = await get({ authenticated: false });

    expect(response.status).toBe(401);
  });

  it("bloqueia quem não é SUPORTE_INTERNO", async () => {
    const lookup = mockLookups("GESTOR");

    const response = await get();

    expect(response.status).toBe(403);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("responde 404 quando o usuário não existe", async () => {
    mockLookups("SUPORTE_INTERNO", null);

    const response = await get();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      codigo: "USUARIO_NAO_ENCONTRADO",
    });
  });

  it("responde 500 em erro inesperado", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoUsuario, "buscarPorId")
      .mockResolvedValueOnce(sessionUser("SUPORTE_INTERNO") as never)
      .mockRejectedValueOnce(new Error("x"));

    const response = await get();

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ codigo: "ERRO_INTERNO" });
  });
});
