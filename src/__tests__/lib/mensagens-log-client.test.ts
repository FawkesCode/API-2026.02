import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cadastrarMensagemLog,
  listarMensagensLog,
  mesclarMensagensLog,
} from "@/lib/mensagens-log-client";

const exemplo = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  mensagem: "Equipe a caminho.",
  criadoEm: "2026-11-19T10:00:00.000Z",
  atualizadoEm: "2026-11-19T10:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("cadastrarMensagemLog", () => {
  it("envia a mensagem sem os espaços das pontas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(exemplo, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(cadastrarMensagemLog("  Equipe a caminho.  ")).resolves.toEqual(exemplo);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/mensagens-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: "Equipe a caminho." }),
    });
  });

  it.each([
    ["", "A mensagem é obrigatória."],
    ["   \n\t ", "A mensagem é obrigatória."],
    ["a".repeat(10_001), "A mensagem excede o limite de 10.000 caracteres."],
  ])("rejeita mensagem inválida sem chamar a API (%#)", async (mensagem, erro) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(cadastrarMensagemLog(mensagem)).rejects.toThrow(erro);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exibe o erro devolvido pela API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ erro: "Acesso negado." }, { status: 403 })),
    );
    await expect(cadastrarMensagemLog("Ok")).rejects.toThrow("Acesso negado.");
  });

  it("apresenta uma mensagem recuperável em falha de conexão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(cadastrarMensagemLog("Ok")).rejects.toThrow("Tente novamente.");
  });
});

describe("listarMensagensLog", () => {
  it("devolve a lista do endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([exemplo]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listarMensagensLog()).resolves.toEqual([exemplo]);
    expect(fetchMock).toHaveBeenCalledWith("/api/mensagens-log", { cache: "no-store" });
  });

  it("propaga o erro da API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ erro: "Sessão expirada." }, { status: 401 })),
    );
    await expect(listarMensagensLog()).rejects.toThrow("Sessão expirada.");
  });
});

describe("mesclarMensagensLog", () => {
  const antiga = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    mensagem: "Mensagem antiga.",
    criadoEm: "2026-11-18T10:00:00.000Z",
    atualizadoEm: "2026-11-18T10:00:00.000Z",
  };

  it("preserva no topo mensagens criadas antes da listagem inicial resolver", () => {
    expect(mesclarMensagensLog([exemplo], [antiga])).toEqual([exemplo, antiga]);
  });

  it("não duplica mensagem quando já veio na listagem da API", () => {
    expect(mesclarMensagensLog([exemplo], [exemplo, antiga])).toEqual([exemplo, antiga]);
  });
});
