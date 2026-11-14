import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { criarTokenDeSessao } from "@/auth/sessao";
import { PATCH } from "@/app/api/usuarios/[id]/senha/route";
import {
  ErroUsuarioInativo,
  servicoUsuario,
} from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440010";
const supportId = "550e8400-e29b-41d4-a716-446655440002";

function request(body: unknown, authenticated = true) {
  const token = criarTokenDeSessao({
    usuarioId: supportId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });

  return new Request(`http://localhost/api/usuarios/${userId}/senha`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(authenticated ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function mockSupportUser(cargo: "SUPORTE_INTERNO" | "GESTOR" = "SUPORTE_INTERNO") {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: supportId,
    nome: "Suporte",
    email: "suporte@example.com",
    cargo,
    ativo: true,
    equipeId: null,
    equipe: null,
    criadoEm: new Date(),
  } as never);
}

beforeEach(() => mockSupportUser());
afterEach(() => vi.restoreAllMocks());

describe("PATCH /api/usuarios/:id/senha", () => {
  it("redefine a senha de um técnico ativo", async () => {
    const resetPassword = vi
      .spyOn(servicoUsuario, "redefinirSenhaDeTecnico")
      .mockResolvedValue({ id: userId });

    const response = await PATCH(request({ novaSenha: "NovaSenha@123" }), {
      params: Promise.resolve({ id: userId }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      mensagem: "Senha redefinida com sucesso.",
    });
    expect(resetPassword).toHaveBeenCalledWith(userId, "NovaSenha@123");
  });

  it("bloqueia usuários sem o cargo de suporte interno", async () => {
    vi.restoreAllMocks();
    mockSupportUser("GESTOR");
    const resetPassword = vi.spyOn(servicoUsuario, "redefinirSenhaDeTecnico");

    const response = await PATCH(request({ novaSenha: "NovaSenha@123" }), {
      params: Promise.resolve({ id: userId }),
    });

    expect(response.status).toBe(403);
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("não altera a senha de usuário inativo", async () => {
    vi.spyOn(servicoUsuario, "redefinirSenhaDeTecnico").mockRejectedValue(
      new ErroUsuarioInativo(),
    );

    const response = await PATCH(request({ novaSenha: "NovaSenha@123" }), {
      params: Promise.resolve({ id: userId }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ codigo: "USUARIO_INATIVO" });
  });

  it("valida a nova senha antes de tentar alterá-la", async () => {
    const resetPassword = vi.spyOn(servicoUsuario, "redefinirSenhaDeTecnico");

    const response = await PATCH(request({ novaSenha: "fraca" }), {
      params: Promise.resolve({ id: userId }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      codigo: "DADOS_INVALIDOS",
      detalhes: { novaSenha: expect.any(Array) },
    });
    expect(resetPassword).not.toHaveBeenCalled();
  });
});
