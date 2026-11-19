import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/mensagens-log/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoMensagemPadraoLog } from "@/services/mensagem-padrao-log.service";
import { servicoUsuario } from "@/services/usuario.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const usuarioId = "550e8400-e29b-41d4-a716-446655440002";
const token = criarTokenDeSessao({
  usuarioId,
  exp: Math.floor(Date.now() / 1000) + 60,
});
const exemplo = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  mensagem: "Começando os trabalhos.",
  criadoEm: new Date("2026-11-19T10:00:00Z"),
  atualizadoEm: new Date("2026-11-19T10:00:00Z"),
};

function requisicao(metodo: "GET" | "POST", corpo?: unknown, autenticada = true) {
  return new Request("http://localhost/api/mensagens-log", {
    method: metodo,
    headers: {
      ...(autenticada ? { authorization: `Bearer ${token}` } : {}),
      ...(metodo === "POST" ? { "content-type": "application/json" } : {}),
    },
    ...(metodo === "POST" ? { body: JSON.stringify(corpo) } : {}),
  });
}

beforeEach(() => {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: usuarioId,
    nome: "Técnico",
    email: "tecnico@example.com",
    cargo: "TECNICO",
    ativo: true,
    equipeId: "550e8400-e29b-41d4-a716-446655440003",
    equipe: { nome: "Equipe" },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("mensagens padrão de log", () => {
  it("exige sessão para listar e salvar", async () => {
    const listar = vi.spyOn(servicoMensagemPadraoLog, "listar");
    const criar = vi.spyOn(servicoMensagemPadraoLog, "criar");

    expect((await GET(requisicao("GET", undefined, false))).status).toBe(401);
    expect((await POST(requisicao("POST", { mensagem: "Teste" }, false))).status).toBe(401);
    expect(listar).not.toHaveBeenCalled();
    expect(criar).not.toHaveBeenCalled();
  });

  it("lista somente as mensagens do usuário autenticado", async () => {
    const listar = vi.spyOn(servicoMensagemPadraoLog, "listar").mockResolvedValue([exemplo]);
    const resposta = await GET(requisicao("GET"));

    expect(resposta.status).toBe(200);
    expect(listar).toHaveBeenCalledWith(usuarioId);
    expect(await resposta.json()).toEqual([{ ...exemplo,
      criadoEm: exemplo.criadoEm.toISOString(), atualizadoEm: exemplo.atualizadoEm.toISOString() }]);
  });

  it("salva texto normalizado com autoria derivada da sessão", async () => {
    const criar = vi.spyOn(servicoMensagemPadraoLog, "criar").mockResolvedValue(exemplo);
    const resposta = await POST(requisicao("POST", { mensagem: "  Começando os trabalhos.  " }));

    expect(resposta.status).toBe(201);
    expect(criar).toHaveBeenCalledWith(usuarioId, { mensagem: "Começando os trabalhos." });
  });

  it("recusa mensagens vazias e campos extras", async () => {
    const criar = vi.spyOn(servicoMensagemPadraoLog, "criar");

    expect((await POST(requisicao("POST", { mensagem: "   " }))).status).toBe(400);
    expect((await POST(requisicao("POST", { mensagem: "Texto", usuarioId: "forjado" }))).status).toBe(400);
    expect(criar).not.toHaveBeenCalled();
  });

  it("impede usuário comercial de acessar os padrões de log", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
      id: usuarioId,
      nome: "Comercial",
      email: "comercial@example.com",
      cargo: "COMERCIAL",
      ativo: true,
      equipeId: null,
      equipe: null,
    });
    expect((await GET(requisicao("GET"))).status).toBe(403);
    expect((await POST(requisicao("POST", { mensagem: "Teste" }))).status).toBe(403);
  });
});
