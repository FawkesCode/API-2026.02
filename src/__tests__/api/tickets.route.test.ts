import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/tickets/route";
import { PATCH } from "@/app/api/tickets/[id]/route";
import {
  ErroNaoAutorizadoParaAlterarPrioridade,
  servicoTicket,
} from "@/lib/services/ticket.service";

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const usuarioId = "550e8400-e29b-41d4-a716-446655440002";

function requisicao(url: string, corpo: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

function dadosValidosParaCriacao() {
  return {
    titulo: "Falha no equipamento",
    descricao: "O equipamento precisa de manutenção.",
    categoria: "MANUTENCAO",
    prioridade: "CRITICA",
    slaEm: new Date(Date.now() + 60_000).toISOString(),
    projetoId: "550e8400-e29b-41d4-a716-446655440000",
    abertoPorId: "550e8400-e29b-41d4-a716-446655440001",
  };
}

afterEach(() => vi.restoreAllMocks());

describe("rotas de tickets", () => {
  it("rejeita uma prioridade inválida antes de criar o ticket", async () => {
    const criar = vi.spyOn(servicoTicket, "criar");
    const resposta = await POST(
      requisicao("http://localhost/api/tickets", {
        ...dadosValidosParaCriacao(),
        prioridade: "URGENTE",
      }),
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toMatchObject({ erro: "Dados inválidos." });
    expect(criar).not.toHaveBeenCalled();
  });

  it("valida e encaminha uma prioridade crítica para a persistência na criação", async () => {
    const ticketCriado = { id: ticketId } as unknown as Awaited<ReturnType<typeof servicoTicket.criar>>;
    const criar = vi.spyOn(servicoTicket, "criar").mockResolvedValue(ticketCriado);
    const resposta = await POST(requisicao("http://localhost/api/tickets", dadosValidosParaCriacao()));

    expect(resposta.status).toBe(201);
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({ prioridade: "CRITICA" }),
    );
  });

  it("rejeita uma prioridade inválida antes de atualizar o ticket", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const resposta = await PATCH(
      requisicao(`http://localhost/api/tickets/${ticketId}`, {
        prioridade: "URGENTE",
        usuarioId,
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toMatchObject({ erro: "Dados inválidos." });
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("persiste a prioridade autorizada e retorna uma mensagem de sucesso", async () => {
    const ticket = { id: ticketId, prioridade: "CRITICA" };
    const ticketAtualizado = ticket as unknown as Awaited<
      ReturnType<typeof servicoTicket.atualizarPrioridade>
    >;
    const atualizar = vi
      .spyOn(servicoTicket, "atualizarPrioridade")
      .mockResolvedValue(ticketAtualizado);

    const resposta = await PATCH(
      requisicao(`http://localhost/api/tickets/${ticketId}`, {
        prioridade: "CRITICA",
        usuarioId,
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      mensagem: "Prioridade atualizada com sucesso.",
      ticket,
    });
    expect(atualizar).toHaveBeenCalledWith(ticketId, { prioridade: "CRITICA", usuarioId });
  });

  it("retorna não autorizado quando o gestor não pertence à equipe do ticket", async () => {
    vi.spyOn(servicoTicket, "atualizarPrioridade").mockRejectedValue(
      new ErroNaoAutorizadoParaAlterarPrioridade(),
    );

    const resposta = await PATCH(
      requisicao(`http://localhost/api/tickets/${ticketId}`, {
        prioridade: "CRITICA",
        usuarioId,
      }),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toMatchObject({
      erro: "Apenas gestores da equipe responsável pelo ticket podem alterar sua prioridade.",
    });
  });
});
