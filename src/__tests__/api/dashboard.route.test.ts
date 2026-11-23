import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/dashboard/route";
import { criarTokenDeSessao } from "@/auth/sessao";
import { servicoDashboard } from "@/services/dashboard.service";
import { servicoUsuario } from "@/services/usuario.service";
import type { AgregacoesVolumeStatusUrgenciaDashboard } from "@/types/dashboard";

process.env.SESSION_SECRET = "segredo-de-teste-com-32-caracteres";

const userId = "550e8400-e29b-41d4-a716-446655440000";
const teamId = "550e8400-e29b-41d4-a716-446655440001";
const projectId = "550e8400-e29b-41d4-a716-446655440002";
const clientId = "550e8400-e29b-41d4-a716-446655440003";
const token = criarTokenDeSessao({
  usuarioId: userId,
  exp: Math.floor(Date.now() / 1000) + 60,
});

const aggregations: AgregacoesVolumeStatusUrgenciaDashboard = {
  volume: { criados: 0, fechados: 0, abertos: 0, encerramentoSolicitado: 0 },
  porStatus: { total: 0, abertos: 0, encerramentoSolicitado: 0, itens: [] },
  abertosPorEquipe: { totalAbertos: 0, equipes: [] },
  porUrgencia: { total: 0, itens: [] },
  porSla: { total: 0, itens: [] },
  resumoSla: { foraDoSla: 0, proximoDoSla: 0 },
  slaEstimadoVsReal: { totalDentroDoSla: 0, totalAtrasado: 0, itens: [] },
};

function createRequest(query = "", authenticated = true) {
  return new Request(`http://localhost/api/dashboard${query}`, {
    method: "GET",
    headers: authenticated ? { authorization: `Bearer ${token}` } : {},
  });
}

beforeEach(() => {
  vi.spyOn(servicoUsuario, "buscarPorId").mockResolvedValue({
    id: userId,
    nome: "Gestor",
    email: "gestor@example.com",
    cargo: "GESTOR",
    ativo: true,
    criadoEm: new Date("2026-01-01T00:00:00.000Z"),
    equipeId: teamId,
    equipe: { nome: "Equipe" },
  });
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/dashboard", () => {
  it("retorna as agregações repassando os filtros combinados", async () => {
    const getDashboardAggregations = vi
      .spyOn(servicoDashboard, "getDashboardAggregations")
      .mockResolvedValue(aggregations);

    const response = await GET(
      createRequest(
        `?equipeId=${teamId}&usuarioId=${userId}&projetoId=${projectId}` +
          `&clienteId=${clientId}&dataInicio=2026-11-01&dataFim=2026-11-15`,
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(aggregations);
    expect(getDashboardAggregations).toHaveBeenCalledWith({
      equipeId: teamId,
      usuarioId: userId,
      projetoId: projectId,
      clienteId: clientId,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-15",
    });
  });

  it("repassa filtros vazios quando nenhum parâmetro é informado", async () => {
    const getDashboardAggregations = vi
      .spyOn(servicoDashboard, "getDashboardAggregations")
      .mockResolvedValue(aggregations);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(getDashboardAggregations).toHaveBeenCalledWith({});
  });

  it("trata equipeId=todas como todas as equipes", async () => {
    const getDashboardAggregations = vi
      .spyOn(servicoDashboard, "getDashboardAggregations")
      .mockResolvedValue(aggregations);

    const response = await GET(createRequest("?equipeId=todas"));

    expect(response.status).toBe(200);
    expect(getDashboardAggregations).toHaveBeenCalledWith({});
  });

  it("retorna 400 para filtros inválidos", async () => {
    const getDashboardAggregations = vi.spyOn(
      servicoDashboard,
      "getDashboardAggregations",
    );

    const response = await GET(
      createRequest("?equipeId=invalido&dataInicio=2026-11-10&dataFim=2026-11-01"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.codigo).toBe("FILTROS_INVALIDOS");
    expect(body.detalhes).toHaveProperty("equipeId");
    expect(body.detalhes).toHaveProperty("dataFim");
    expect(getDashboardAggregations).not.toHaveBeenCalled();
  });

  it("retorna 401 sem sessão", async () => {
    const getDashboardAggregations = vi.spyOn(
      servicoDashboard,
      "getDashboardAggregations",
    );

    const response = await GET(createRequest("", false));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      erro: "Não autenticado.",
      codigo: "NAO_AUTENTICADO",
    });
    expect(getDashboardAggregations).not.toHaveBeenCalled();
  });

  it("retorna 500 quando o serviço falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(servicoDashboard, "getDashboardAggregations").mockRejectedValue(
      new Error("falha no banco"),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      erro: "Erro interno ao carregar indicadores do dashboard.",
      codigo: "ERRO_INTERNO",
    });
  });
});
