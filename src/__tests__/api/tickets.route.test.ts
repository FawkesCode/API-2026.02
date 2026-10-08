import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/tickets/route";
import { PUT } from "@/app/api/tickets/[id]/route";
import { criarTokenDeSessao } from "@/lib/auth/sessao";
import {
  ErroNaoAutorizadoParaAlterarPrioridade,
  servicoTicket,
} from "@/lib/services/ticket.service";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const ticketId = "550e8400-e29b-41d4-a716-446655440010";
const usuarioDaSessaoId = "550e8400-e29b-41d4-a716-446655440002";
const usuarioForjadoId = "550e8400-e29b-41d4-a716-446655440009";
const equipeId = "550e8400-e29b-41d4-a716-446655440003";
const tokenDaSessao = criarTokenDeSessao({
  usuarioId: usuarioDaSessaoId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

function requisicao(
  url: string,
  corpo: unknown,
  token?: string,
  metodo: "POST" | "PUT" = "POST",
) {
  return new Request(url, {
    method: metodo,
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
    equipeIds: [equipeId],
  };
}

function ticketComRelacoes(id = ticketId, prioridade = "CRITICA") {
  return {
    id,
    titulo: "Falha no equipamento",
    descricao: "O equipamento precisa de manutenção.",
    categoria: "MANUTENCAO",
    prioridade,
    status: "NAO_INICIADO",
    slaEm: new Date(Date.now() + 60_000),
    criadoEm: new Date("2026-09-24T10:00:00.000Z"),
    atualizadoEm: new Date("2026-09-24T10:00:00.000Z"),
    encerradoEm: null,
    projetoId: "550e8400-e29b-41d4-a716-446655440000",
    abertoPorId: "550e8400-e29b-41d4-a716-446655440001",
    responsavelId: null,
    abertoPor: { id: "550e8400-e29b-41d4-a716-446655440001", nome: "Gestor Teste" },
    responsavel: null,
    projeto: { id: "550e8400-e29b-41d4-a716-446655440000", nome: "Projeto Teste" },
    equipesAlocadas: [{ equipe: { id: equipeId, nome: "Equipe Suporte" } }],
  } as unknown as Awaited<ReturnType<typeof servicoTicket.criar>>;
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
    const ticketCriado = ticketComRelacoes();
    const criar = vi.spyOn(servicoTicket, "criar").mockResolvedValue(ticketCriado);
    const resposta = await POST(requisicao("http://localhost/api/tickets", dadosValidosParaCriacao()));

    expect(resposta.status).toBe(201);
    expect(criar).toHaveBeenCalledWith(
      expect.objectContaining({ prioridade: "CRITICA", equipeIds: [equipeId] }),
    );
    expect(await resposta.json()).toMatchObject({
      id: ticketId,
      createdBy: "Gestor Teste",
      teams: [{ id: equipeId, nome: "Equipe Suporte" }],
    });
  });

  it("rejeita uma prioridade inválida antes de atualizar o ticket", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const resposta = await PUT(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "URGENTE", usuarioId: usuarioForjadoId },
        tokenDaSessao,
        "PUT",
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toMatchObject({ erro: "Dados inválidos." });
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("usa o usuário da sessão, e não um usuarioId enviado pelo cliente", async () => {
    const ticketAtualizado = ticketComRelacoes();
    const atualizar = vi
      .spyOn(servicoTicket, "atualizarPrioridade")
      .mockResolvedValue(ticketAtualizado);

    const resposta = await PUT(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA", usuarioId: usuarioForjadoId },
        tokenDaSessao,
        "PUT",
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toMatchObject({
      id: ticketId,
      priority: "Crítica",
      createdBy: "Gestor Teste",
    });
    expect(atualizar).toHaveBeenCalledWith(ticketId, {
      prioridade: "CRITICA",
      usuarioId: usuarioDaSessaoId,
    });
  });

  it("rejeita a atualização sem uma sessão autenticada", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const resposta = await PUT(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA" },
        undefined,
        "PUT",
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(401);
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("rejeita um token cuja assinatura foi adulterada", async () => {
    const atualizar = vi.spyOn(servicoTicket, "atualizarPrioridade");
    const ultimoCaractere = tokenDaSessao.at(-1);
    const tokenAdulterado = `${tokenDaSessao.slice(0, -1)}${ultimoCaractere === "a" ? "b" : "a"}`;
    const resposta = await PUT(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA" },
        tokenAdulterado,
        "PUT",
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

    const resposta = await PUT(
      requisicao(
        `http://localhost/api/tickets/${ticketId}`,
        { prioridade: "CRITICA" },
        tokenDaSessao,
        "PUT",
      ),
      { params: Promise.resolve({ id: ticketId }) },
    );

    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toMatchObject({
      erro: "Apenas gestores da equipe responsável pelo ticket podem alterar sua prioridade.",
    });
  });

  it("lista todos os tickets, sem filtrar por projeto nem por equipe, quando nenhum usuarioId é informado", async () => {
    const ticket = {
      id: ticketId,
      titulo: "Falha no equipamento",
      descricao: "O equipamento precisa de manutenção.",
      categoria: "MANUTENCAO",
      prioridade: "CRITICA",
      status: "NAO_INICIADO",
      criadoEm: new Date("2026-09-24T10:00:00.000Z"),
      slaEm: new Date("2026-09-25T10:00:00.000Z"),
      projeto: { id: "550e8400-e29b-41d4-a716-446655440000", localInstalacao: "Sala 1" },
      equipesAlocadas: [],
    };
    const listarTodos = vi
      .spyOn(servicoTicket, "listarTodos")
      .mockResolvedValue([ticket] as unknown as Awaited<ReturnType<typeof servicoTicket.listarTodos>>);
    const listarPorEquipe = vi.spyOn(servicoTicket, "listarPorEquipeDoUsuario");

    const resposta = await GET(new Request("http://localhost/api/tickets"));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo).toHaveLength(1);
    expect(corpo[0]).toMatchObject({ id: ticketId, title: "Falha no equipamento" });
    expect(listarTodos).toHaveBeenCalledWith();
    expect(listarPorEquipe).not.toHaveBeenCalled();
  });

  it("continua filtrando pela equipe do usuário quando usuarioId é informado", async () => {
    const listarPorEquipe = vi
      .spyOn(servicoTicket, "listarPorEquipeDoUsuario")
      .mockResolvedValue(
        [] as unknown as Awaited<ReturnType<typeof servicoTicket.listarPorEquipeDoUsuario>>,
      );
    const listarTodos = vi.spyOn(servicoTicket, "listarTodos");

    const resposta = await GET(
      new Request(`http://localhost/api/tickets?usuarioId=${usuarioDaSessaoId}`),
    );

    expect(resposta.status).toBe(200);
    expect(listarPorEquipe).toHaveBeenCalledWith(usuarioDaSessaoId);
    expect(listarTodos).not.toHaveBeenCalled();
  });

  it("rejeita um usuarioId inválido na listagem", async () => {
    const resposta = await GET(new Request("http://localhost/api/tickets?usuarioId=not-a-uuid"));

    expect(resposta.status).toBe(400);
  });
});
