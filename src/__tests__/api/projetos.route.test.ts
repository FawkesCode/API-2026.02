import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/projetos/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoProjeto } from "@/services/projeto.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";
const usuario = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  nome: "Técnico",
  email: "tecnico@example.com",
  cargo: "TECNICO" as const,
  ativo: true,
  equipeId: "equipe",
  equipe: { nome: "Equipe" },
};
function requisicao(autenticado = true) {
  const token = criarTokenDeSessao({
    usuarioId: usuario.id,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Request("http://localhost/api/projetos", {
    headers: autenticado ? { authorization: `Bearer ${token}` } : {},
  });
}
afterEach(() => vi.restoreAllMocks());
describe("listagem de projetos", () => {
  it("bloqueia requisição sem sessão antes de buscar projetos", async () => {
    const listar = vi.spyOn(servicoProjeto, "listarAtivos");
    const buscar = vi.spyOn(servicoUsuario, "buscarPorId");
    expect((await GET(requisicao(false))).status).toBe(401);
    expect(listar).not.toHaveBeenCalled();
    expect(buscar).not.toHaveBeenCalled();
  });
  it.each([null, { ...usuario, ativo: false }])(
    "bloqueia usuário inexistente ou inativo",
    async (registro) => {
      vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(registro);
      const listar = vi.spyOn(servicoProjeto, "listarAtivos");
      expect((await GET(requisicao())).status).toBe(403);
      expect(listar).not.toHaveBeenCalled();
    },
  );
  it("permite listagem com sessão válida e usuário ativo", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue(usuario);
    vi.spyOn(servicoProjeto, "listarAtivos").mockResolvedValue([]);
    const resposta = await GET(requisicao());
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual([]);
  });
});
