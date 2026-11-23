import { afterEach, describe, expect, it, vi } from "vitest";
import { EQUIPE_JA_ASSOCIADA, mencionarEquipe } from "@/lib/mencionar-equipe-client";

const ticketId = "ticket-id";
const equipeId = "equipe-id";

afterEach(() => vi.unstubAllGlobals());

describe("mencionarEquipe", () => {
  it("envia o motivo do acionamento ao endpoint de equipes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ notificacaoEmail: "PENDENTE" }));
    vi.stubGlobal("fetch", fetchMock);

    await mencionarEquipe(ticketId, equipeId, "  Precisamos revisar os logs.  ", new Set());

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`/api/tickets/${ticketId}/equipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipeId, relatorio: "Precisamos revisar os logs." }),
    });
  });

  it.each([
    ["", "Motivo", new Set<string>(), "Selecione um time."],
    [equipeId, "Motivo", new Set([equipeId]), EQUIPE_JA_ASSOCIADA],
    [equipeId, "   ", new Set<string>(), "Informe a razão do acionamento."],
    [equipeId, "a".repeat(10_001), new Set<string>(), "O relatório deve ter até 10.000 caracteres."],
  ] as const)("rejeita dados inválidos sem chamar a API (%#)", async (id, motivo, associados, mensagem) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(mencionarEquipe(ticketId, id, motivo, associados)).rejects.toThrow(mensagem);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [409, "A equipe já está associada a este ticket."],
    [403, "Você não tem permissão para atribuir equipes."],
  ] as const)("exibe a mensagem da API em caso de erro %i", async (status, erro) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ erro }, { status })));
    await expect(mencionarEquipe(ticketId, equipeId, "Motivo", new Set())).rejects.toThrow(erro);
  });

  it("apresenta uma mensagem recuperável em falha de conexão", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(mencionarEquipe(ticketId, equipeId, "Motivo", new Set())).rejects.toThrow("Tente novamente.");
  });
});
