import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/usuarios/detalhado/route";
import { GET as GET_SELECAO } from "@/app/api/usuarios/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const sessionUser = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  nome: "Analista",
  email: "analista@example.com",
  cargo: "SUPORTE" as const,
  ativo: true,
  equipeId: null,
  equipe: null,
};

const detailedList = [
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    nome: "Técnico",
    email: "tecnico@example.com",
    cargo: "TECNICO" as const,
    ativo: true,
    senhaProvisoria: false,
    equipe: { nome: "Equipe Campo" },
  },
];

function request(authenticated = true) {
  const token = criarTokenDeSessao({
    usuarioId: sessionUser.id,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Request("http://localhost/api/usuarios/detalhado", {
    headers: authenticated ? { authorization: `Bearer ${token}` } : {},
  });
}

afterEach(() => vi.restoreAllMocks());

describe("GET /api/usuarios/detalhado", () => {
  it("retorna 401 sem sessão antes de consultar o banco", async () => {
    const list = vi.spyOn(servicoUsuario, "listDetailed");
    const resposta = await GET(request(false));

    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual({
      erro: "Não autenticado.",
      codigo: "NAO_AUTENTICADO",
    });
    expect(list).not.toHaveBeenCalled();
  });

  it.each([null, { ...sessionUser, ativo: false }])(
    "retorna 401 para usuário inexistente ou inativo",
    async (registro) => {
      vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(registro);
      const list = vi.spyOn(servicoUsuario, "listDetailed");
      const resposta = await GET(request());

      expect(resposta.status).toBe(401);
      expect((await resposta.json()).codigo).toBe("NAO_AUTENTICADO");
      expect(list).not.toHaveBeenCalled();
    },
  );

  it.each(["TECNICO", "GESTOR", "COMERCIAL"] as const)(
    "retorna 403 para usuário ativo com cargo %s",
    async (cargo) => {
      vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
        ...sessionUser,
        cargo,
      });
      const list = vi.spyOn(servicoUsuario, "listDetailed");
      const resposta = await GET(request());

      expect(resposta.status).toBe(403);
      expect(await resposta.json()).toEqual({
        erro: "Usuário sem permissão.",
        codigo: "SEM_PERMISSAO",
      });
      expect(list).not.toHaveBeenCalled();
    },
  );

  it("retorna 200 com a lista de usuários", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(sessionUser);
    const list = vi
      .spyOn(servicoUsuario, "listDetailed")
      .mockResolvedValue(detailedList);
    const resposta = await GET(request());

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual(detailedList);
    expect(list).toHaveBeenCalled();
  });

  it("retorna 500 no formato padrão quando o serviço falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(sessionUser);
    vi.spyOn(servicoUsuario, "listDetailed").mockRejectedValue(new Error("db"));
    const resposta = await GET(request());

    expect(resposta.status).toBe(500);
    expect((await resposta.json()).codigo).toBe("ERRO_INTERNO");
  });
});

describe("GET /api/usuarios (dropdowns)", () => {
  it("continua retornando apenas id e nome", async () => {
    const selection = [{ id: sessionUser.id, nome: sessionUser.nome }];
    vi.spyOn(servicoUsuario, "listarParaSelecao").mockResolvedValue(selection);
    const resposta = await GET_SELECAO(
      new Request("http://localhost/api/usuarios?cargo=GESTOR"),
    );

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual(selection);
  });
});
