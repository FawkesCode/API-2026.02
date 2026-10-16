import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";
import { PATCH } from "@/app/api/auth/password/route";

const usuario = {
  id: "8aab3c01-65d5-4b88-8d73-bb53e468bf69",
  nome: "Usuário de Teste",
  email: "teste@example.com",
  cargo: "TECNICO" as const,
  ativo: true,
  equipeId: null,
  equipe: null,
};

function request(body: unknown, authenticated = true) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (authenticated) {
    headers.set(
      "Cookie",
      `session=${criarTokenDeSessao({
        usuarioId: usuario.id,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })}`,
    );
  }
  return new Request("http://localhost/api/auth/password", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/auth/password", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "segredo-de-teste-para-sessao");
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(usuario);
    vi.spyOn(servicoUsuario, "alterarSenha").mockResolvedValue({ id: usuario.id });
  });

  it("exige uma sessão", async () => {
    const response = await PATCH(request({ novaSenha: "NovaSenha@123" }, false));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ codigo: "NAO_AUTENTICADO" });
    expect(servicoUsuario.alterarSenha).not.toHaveBeenCalled();
  });

  it("persiste a nova senha para o usuário da sessão", async () => {
    const response = await PATCH(request({ novaSenha: "NovaSenha@123" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(servicoUsuario.alterarSenha).toHaveBeenCalledWith(
      usuario.id,
      "NovaSenha@123",
    );
  });

  it("rejeita uma senha que não atende aos requisitos", async () => {
    const response = await PATCH(request({ novaSenha: "fraca" }));

    expect(response.status).toBe(400);
    expect(servicoUsuario.alterarSenha).not.toHaveBeenCalled();
  });
});
