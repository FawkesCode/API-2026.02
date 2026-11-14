import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/relatorios/projetos/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoUsuario } from "@/services/usuario.service";

const { queryMock, endMock, createConnectionMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  endMock: vi.fn(),
  createConnectionMock: vi.fn(),
}));

vi.mock("mariadb", () => ({
  createConnection: createConnectionMock,
}));

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const gestorId = "550e8400-e29b-41d4-a716-446655440010";
const equipeId = "550e8400-e29b-41d4-a716-446655440011";

function requisicao(usuarioId: string, autenticada = true) {
  const token = criarTokenDeSessao({
    usuarioId,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Request("http://localhost/api/relatorios/projetos", {
    headers: autenticada ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  queryMock.mockResolvedValue([[], { affectedRows: 0 }]);
  endMock.mockResolvedValue(undefined);
  createConnectionMock.mockResolvedValue({ query: queryMock, end: endMock });
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/relatorios/projetos", () => {
  it("exige autenticação", async () => {
    const resposta = await GET(requisicao(gestorId, false));

    expect(resposta.status).toBe(401);
    expect(createConnectionMock).not.toHaveBeenCalled();
  });

  it("recusa cargos que não podem consultar o relatório", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
      id: gestorId,
      nome: "Comercial",
      email: "comercial@example.com",
      cargo: "COMERCIAL",
      ativo: true,
      equipeId: null,
      equipe: null,
    } as never);

    const resposta = await GET(requisicao(gestorId));

    expect(resposta.status).toBe(403);
    expect(createConnectionMock).not.toHaveBeenCalled();
  });

  it("limita gestor à sua equipe ao invocar a procedure", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
      id: gestorId,
      nome: "Gestor",
      email: "gestor@example.com",
      cargo: "GESTOR",
      ativo: true,
      equipeId,
      equipe: { nome: "Equipe de teste" },
    } as never);
    queryMock.mockResolvedValue([
      [
        {
          projeto_id: "id-projeto-1",
          projeto: "Projeto 1",
          cliente: "Cliente",
          equipe: "Equipe",
          gestor: "Gestor",
          total_tickets: 3,
          tickets_abertos: 2,
          tickets_atrasados: 1,
        },
      ],
      { affectedRows: 0 },
    ]);

    const resposta = await GET(requisicao(gestorId));
    const corpo = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(corpo.projetos).toEqual([
      {
        projeto_id: "id-projeto-1",
        projeto: "Projeto 1",
        cliente: "Cliente",
        equipe: "Equipe",
        gestor: "Gestor",
        total_tickets: 3,
        tickets_abertos: 2,
        tickets_atrasados: 1,
      },
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      "CALL bdr_av3.sp_resumo_projetos(?)",
      [equipeId],
    );
  });

  it("permite suporte interno consultar todas as equipes", async () => {
    vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
      id: gestorId,
      nome: "Suporte Interno",
      email: "suporte@example.com",
      cargo: "SUPORTE_INTERNO",
      ativo: true,
      equipeId: null,
      equipe: null,
    } as never);

    const resposta = await GET(requisicao(gestorId));

    expect(resposta.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(
      "CALL bdr_av3.sp_resumo_projetos(?)",
      [null],
    );
  });
});
