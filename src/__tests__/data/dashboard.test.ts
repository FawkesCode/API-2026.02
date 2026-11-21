import { afterEach, describe, expect, it, vi } from "vitest";
import { servicoDashboard } from "@/services/dashboard.service";
import {
  getAgregacoesDashboard,
  getChamadosCriados,
  getChamadosFechados,
  getResumoSla,
  getSlaEstimadoVsReal,
  getTicketsAbertosPorEquipe,
  getTicketsPorSla,
  getTicketsPorStatus,
  getTicketsPorUrgencia,
} from "@/lib/data/dashboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lib/data/dashboard", () => {
  it("encaminha filtros corretamente para cada método do servicoDashboard", async () => {
    const filtros = {
      equipeId: "550e8400-e29b-41d4-a716-446655440001",
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    };

    const s1 = vi
      .spyOn(servicoDashboard, "obterAgregacoesVolumeStatusUrgencia")
      .mockResolvedValue({} as never);
    const s2 = vi
      .spyOn(servicoDashboard, "contarChamadosCriados")
      .mockResolvedValue(10);
    const s3 = vi
      .spyOn(servicoDashboard, "contarChamadosFechados")
      .mockResolvedValue(4);
    const s4 = vi
      .spyOn(servicoDashboard, "agruparPorStatus")
      .mockResolvedValue({ total: 0, abertos: 0, encerramentoSolicitado: 0, itens: [] });
    const s5 = vi
      .spyOn(servicoDashboard, "agruparAbertosPorEquipe")
      .mockResolvedValue({ totalAbertos: 0, equipes: [] });
    const s6 = vi
      .spyOn(servicoDashboard, "agruparPorUrgencia")
      .mockResolvedValue({ total: 0, itens: [] });
    const s7 = vi
      .spyOn(servicoDashboard, "agruparPorSla")
      .mockResolvedValue({ total: 0, itens: [] });
    const s8 = vi
      .spyOn(servicoDashboard, "contarResumoSla")
      .mockResolvedValue({ foraDoSla: 1, proximoDoSla: 2 });
    const s9 = vi
      .spyOn(servicoDashboard, "agruparSlaEstimadoVsReal")
      .mockResolvedValue({ totalEstimado: 0, totalReal: 0, itens: [] });

    await getAgregacoesDashboard(filtros);
    expect(await getChamadosCriados(filtros)).toBe(10);
    expect(await getChamadosFechados(filtros)).toBe(4);
    await getTicketsPorStatus(filtros);
    await getTicketsAbertosPorEquipe(filtros);
    await getTicketsPorUrgencia(filtros);
    await getTicketsPorSla(filtros);
    expect(await getResumoSla(filtros)).toEqual({ foraDoSla: 1, proximoDoSla: 2 });
    await getSlaEstimadoVsReal(filtros);

    for (const spy of [s1, s2, s3, s4, s5, s6, s7, s8, s9]) {
      expect(spy).toHaveBeenCalledWith(filtros);
    }
  });

  it("converte falhas inesperadas do serviço em mensagens amigáveis", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(
      servicoDashboard,
      "obterAgregacoesVolumeStatusUrgencia",
    ).mockRejectedValue(new Error("db offline"));
    vi.spyOn(servicoDashboard, "agruparPorSla").mockRejectedValue(
      new Error("db offline"),
    );
    vi.spyOn(servicoDashboard, "contarResumoSla").mockRejectedValue(
      new Error("db offline"),
    );
    vi.spyOn(servicoDashboard, "agruparSlaEstimadoVsReal").mockRejectedValue(
      new Error("db offline"),
    );

    await expect(getAgregacoesDashboard()).rejects.toThrow(
      "Não foi possível carregar os indicadores do dashboard.",
    );
    await expect(getTicketsPorSla()).rejects.toThrow(
      "Não foi possível carregar os chamados por SLA.",
    );
    await expect(getResumoSla()).rejects.toThrow(
      "Não foi possível carregar o resumo de SLA.",
    );
    await expect(getSlaEstimadoVsReal()).rejects.toThrow(
      "Não foi possível carregar o comparativo de SLA estimado vs tempo real.",
    );
  });
});
