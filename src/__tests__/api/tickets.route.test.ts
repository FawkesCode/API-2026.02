import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/tickets/route";
import { PATCH } from "@/app/api/tickets/[id]/route";
import { criarTokenDeSessao } from "@/lib/auth/sessao";
import {
  ErroNaoAutorizadoParaAlterarPrioridade,
  servicoTicket,
} from "@/lib/services/ticket.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const usuarioDaSessaoId = "550e8400-e29b-41d4-a716-446655440002";
const usuarioForjadoId = "550e8400-e29b-41d4-a716-446655440009";
const tokenDaSessao = criarTokenDeSessao({
  usuarioId: usuarioDaSessaoId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

function requisicao(url: string, corpo: unknown, token?: string) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
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
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "URGENTE", usuarioId: usuarioForjadoId },
        tokenDaSessao,
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toMatchObject({ erro: "Dados inválidos." });
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("usa o usuário da sessão, e não um usuarioId enviado pelo cliente", async () => {
    const ticket = { id: ticketId, prioridade: "CRITICA" };
    const ticketAtualizado = ticket as unknown as Awaited<
      ReturnType<typeof servicoTicket.atualizarPrioridade>
    >;
    const atualizar = vi
      .spyOn(servicoTicket, "atualizarPrioridade")
      .mockResolvedValue(ticketAtualizado);

    const resposta = await PATCH(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA", usuarioId: usuarioForjadoId },
        tokenDaSessao,
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      mensagem: "Prioridade atualizada com sucesso.",
      ticket,
    });
    expect(atualizar).toHaveBeenCalledWith(ticketId, {
      prioridade: "CRITICA",
      usuarioId: usuarioDaSessaoId,
    });
  });

  it("rejeita a atualização sem uma sessão autenticada", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const resposta = await PATCH(
      requisicao(`http://localhost/api/tickets/${ticketId}`, { prioridade: "CRITICA" }),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(401);
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("rejeita um token cuja assinatura foi adulterada", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const ultimoCaractere = tokenDaSessao.at(-1);
    const tokenAdulterado = `${tokenDaSessao.slice(0, -1)}${ultimoCaractere === "a" ? "b" : "a"}`;
    const resposta = await PATCH(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA" },
        tokenAdulterado,
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(401);
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("retorna não autorizado quando o gestor não pertence à equipe do ticket", async () => {
    vi.spyOn(servicoTicket, "atualizarPrioridade").mockRejectedValue(
      new ErroNaoAutorizadoParaAlterarPrioridade(),
    );

    const resposta = await PATCH(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA" },
        tokenDaSessao,
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toMatchObject({
      erro: "Apenas gestores da equipe responsável pelo ticket podem alterar sua prioridade.",
    });
  });
});
