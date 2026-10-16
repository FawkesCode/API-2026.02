import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";
import { POST } from "@/app/api/auth/login/route";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440002";
let passwordHash: string;

const activeUser = () => ({
  id: userId,
  nome: "Ana Silva",
  email: "ana@example.com",
  senhaHash: passwordHash,
  cargo: "TECNICO" as const,
  ativo: true,
  senhaProvisoria: true,
});

function request(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  passwordHash = await hash("Senha@123", 4);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("POST /api/auth/login", () => {
  it("autentica usuário ativo e emite cookie httpOnly de 8 horas", async () => {
    vi.spyOn(servicoUsuario, "buscarCredenciaisPorEmail").mockResolvedValue(activeUser());

    const resposta = await POST(request({ email: " ANA@EXAMPLE.COM ", senha: "Senha@123" }));
    const cookie = resposta.headers.get("set-cookie") ?? "";

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toMatchObject({
      usuario: { id: userId, email: "ana@example.com", cargo: "TECNICO" },
      senhaProvisoria: true,
    });
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=28800");
    expect(cookie).toContain("SameSite=lax");
  });

  it("marca o cookie secure em produção", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(servicoUsuario, "buscarCredenciaisPorEmail").mockResolvedValue(activeUser());

    const resposta = await POST(request({ email: "ana@example.com", senha: "Senha@123" }));

    expect(resposta.headers.get("set-cookie")).toContain("Secure");
  });

  it.each([
    ["e-mail inexistente", null, "qualquer senha"],
    ["senha incorreta", activeUser(), "senha incorreta"],
    ["usuário inativo", { ...activeUser(), ativo: false }, "Senha@123"],
  ])("retorna a mesma resposta genérica para %s", async (_caso, usuario, senha) => {
    vi.spyOn(servicoUsuario, "buscarCredenciaisPorEmail").mockResolvedValue(usuario);

    const resposta = await POST(request({ email: "ana@example.com", senha }));

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual({
      erro: "Credenciais inválidas.",
      codigo: "CREDENCIAIS_INVALIDAS",
    });
    expect(resposta.headers.get("set-cookie")).toBeNull();
  });

  it("valida o formato do corpo", async () => {
    const buscar = vi.spyOn(servicoUsuario, "buscarCredenciaisPorEmail");
    const resposta = await POST(request({ email: "invalido", senha: "x" }));

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toMatchObject({ codigo: "DADOS_INVALIDOS" });
    expect(buscar).not.toHaveBeenCalled();
  });
});
