import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dev/sessao/route";
import { obterSessaoDaRequisicao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

vi.mock("@/lib/services/usuario.service", () => ({
  servicoUsuario: { buscarPorId: vi.fn(), buscarPorEmail: vi.fn() },
}));

const gestor = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  nome: "Gestor da Equipe Massa",
  email: "gestor.seed@example.com",
  cargo: "GESTOR" as const,
  ativo: true,
  equipeId: "550e8400-e29b-41d4-a716-446655440003",
  equipe: { nome: "Equipe Massa" },
};

function requisicao(corpo = {}) {
  return new Request("http://localhost/api/dev/sessao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("production", "false");
  vi.stubEnv("SESSION_SECRET", "segredo-para-testar-sessoes-do-seed");
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe("sessão de desenvolvimento", () => {
  it("entra com o gestor do seed e emite uma sessão válida", async () => {
    vi.mocked(servicoUsuario.buscarPorEmail).mockResolvedValue(gestor);

    const resposta = await POST(requisicao());
    expect(resposta.status).toBe(200);
    expect(servicoUsuario.buscarPorEmail).toHaveBeenCalledWith(gestor.email);
    expect(
      obterSessaoDaRequisicao(
        new Request("http://localhost", {
          headers: { cookie: resposta.headers.get("set-cookie")! },
        }),
      ),
    ).toEqual({ usuarioId: gestor.id });
  });

  it("permite selecionar o Massa pelo ID informado", async () => {
    const massa = { ...gestor, cargo: "TECNICO" as const };
    vi.mocked(servicoUsuario.buscarPorId).mockResolvedValue(massa);

    expect((await POST(requisicao({ usuarioId: massa.id }))).status).toBe(200);
    expect(servicoUsuario.buscarPorId).toHaveBeenCalledWith(massa.id);
    expect(servicoUsuario.buscarPorEmail).not.toHaveBeenCalled();
  });

  it("não emite sessão para um usuário desativado", async () => {
    vi.mocked(servicoUsuario.buscarPorId).mockResolvedValue({
      ...gestor,
      ativo: false,
    });

    const resposta = await POST(requisicao({ usuarioId: gestor.id }));
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get("set-cookie")).toBeNull();
  });

  it.each(["NODE_ENV", "production"])(
    "não funciona em produção (%s)",
    async (variavel) => {
      vi.stubEnv(variavel, variavel === "NODE_ENV" ? "production" : "true");

      expect((await POST(requisicao())).status).toBe(404);
      expect(servicoUsuario.buscarPorEmail).not.toHaveBeenCalled();
      expect(servicoUsuario.buscarPorId).not.toHaveBeenCalled();
    },
  );
});
