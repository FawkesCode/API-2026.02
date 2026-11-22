import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FALHA_LISTAR_MENSAGENS_PADRAO,
  listarMensagensPadraoLog,
  textoParaParagrafos,
} from "@/lib/mensagens-padrao-log-client";

afterEach(() => vi.unstubAllGlobals());

describe("listarMensagensPadraoLog", () => {
  it("busca as mensagens do usuário em /api/mensagens-log", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([
        { id: "m1", mensagem: "Troca de cabo", criadoEm: "2026-11-20T10:00:00.000Z", atualizadoEm: "2026-11-20T10:00:00.000Z" },
        { id: "m2", mensagem: "Reinício do equipamento", criadoEm: "2026-11-19T10:00:00.000Z", atualizadoEm: "2026-11-19T10:00:00.000Z" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listarMensagensPadraoLog()).resolves.toEqual([
      { id: "m1", mensagem: "Troca de cabo" },
      { id: "m2", mensagem: "Reinício do equipamento" },
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/mensagens-log", { signal: undefined });
  });

  it("aceita lista vazia", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    await expect(listarMensagensPadraoLog()).resolves.toEqual([]);
  });

  it("repassa a mensagem de erro da API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ erro: "Acesso negado." }, { status: 403 })),
    );
    await expect(listarMensagensPadraoLog()).rejects.toThrow("Acesso negado.");
  });

  it("usa mensagem genérica quando a resposta não tem o formato esperado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ itens: [] })));
    await expect(listarMensagensPadraoLog()).rejects.toThrow(FALHA_LISTAR_MENSAGENS_PADRAO);
  });

  it("usa mensagem genérica em erro sem corpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(listarMensagensPadraoLog()).rejects.toThrow(FALHA_LISTAR_MENSAGENS_PADRAO);
  });
});

describe("textoParaParagrafos", () => {
  it("transforma cada linha em um parágrafo de texto puro", () => {
    expect(textoParaParagrafos("Linha 1\n\n<b>Linha 3</b>")).toEqual([
      { type: "paragraph", content: [{ type: "text", text: "Linha 1" }] },
      { type: "paragraph" },
      { type: "paragraph", content: [{ type: "text", text: "<b>Linha 3</b>" }] },
    ]);
  });
});
