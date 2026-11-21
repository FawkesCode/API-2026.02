import { describe, expect, it } from "vitest";
import { Prioridade, StatusTicket } from "@/types/ticket-enums";
import { FAIXA_SLA_DASHBOARD } from "@/types/dashboard";
import {
  mapEquipesParaGrafico,
  mapSlaEstimadoVsRealParaGrafico,
  mapSlaParaGrafico,
  mapStatusParaGrafico,
  mapUrgenciaParaGrafico,
} from "@/lib/mappers/dashboard.mapper";

describe("dashboard.mapper", () => {
  it("mapeia todos os status para as chaves e cores esperadas pelo gráfico", () => {
    const resultado = mapStatusParaGrafico({
      total: 15,
      abertos: 10,
      encerramentoSolicitado: 2,
      itens: [
        { status: StatusTicket.NAO_INICIADO, label: "Não iniciado", quantidade: 1 },
        { status: StatusTicket.EM_ANDAMENTO, label: "Em andamento", quantidade: 6 },
        {
          status: StatusTicket.SOLICITACAO_ENCERRAMENTO,
          label: "Encerramento solicitado",
          quantidade: 2,
        },
        { status: StatusTicket.EM_REVISAO, label: "Em revisão", quantidade: 1 },
        { status: StatusTicket.ENCERRADO, label: "Encerrado", quantidade: 5 },
      ],
    });

    expect(resultado).toEqual([
      { status: "notStarted", tickets: 1, fill: "var(--color-notStarted)" },
      { status: "inProgress", tickets: 6, fill: "var(--color-inProgress)" },
      {
        status: "closureRequested",
        tickets: 2,
        fill: "var(--color-closureRequested)",
      },
      { status: "inReview", tickets: 1, fill: "var(--color-inReview)" },
      { status: "closed", tickets: 5, fill: "var(--color-closed)" },
    ]);
  });

  it("mapeia equipes abertas preservando nome e quantidade", () => {
    const resultado = mapEquipesParaGrafico({
      totalAbertos: 8,
      equipes: [
        { equipeId: "e1", nome: "Equipe A", quantidade: 5 },
        { equipeId: "e2", nome: "Equipe B", quantidade: 0 },
        { equipeId: "e3", nome: "Equipe C", quantidade: 3 },
      ],
    });

    expect(resultado).toEqual([
      { team: "Equipe A", tickets: 5 },
      { team: "Equipe B", tickets: 0 },
      { team: "Equipe C", tickets: 3 },
    ]);
  });

  it("mapeia urgências usando o rótulo e a quantidade", () => {
    const resultado = mapUrgenciaParaGrafico({
      total: 10,
      itens: [
        { prioridade: Prioridade.CRITICA, label: "Crítica", quantidade: 2 },
        { prioridade: Prioridade.ALTA, label: "Alta", quantidade: 3 },
        { prioridade: Prioridade.MEDIA, label: "Média", quantidade: 4 },
        { prioridade: Prioridade.BAIXA, label: "Baixa", quantidade: 1 },
      ],
    });

    expect(resultado).toEqual([
      { priority: "Crítica", tickets: 2 },
      { priority: "Alta", tickets: 3 },
      { priority: "Média", tickets: 4 },
      { priority: "Baixa", tickets: 1 },
    ]);
  });

  it("mapeia todas as 6 faixas de SLA para as chaves do gráfico TicketsPerSla", () => {
    const resultado = mapSlaParaGrafico({
      total: 21,
      itens: [
        { sla: FAIXA_SLA_DASHBOARD.SLA_4H, label: "4 horas", quantidade: 6 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_8H, label: "8 horas", quantidade: 5 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_1D, label: "1 dia", quantidade: 4 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_2D, label: "2 dias", quantidade: 3 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_3D, label: "3 dias", quantidade: 2 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_7D, label: "7 dias", quantidade: 1 },
      ],
    });

    expect(resultado).toEqual([
      { sla: "sla4h", tickets: 6, fill: "var(--color-sla4h)" },
      { sla: "sla8h", tickets: 5, fill: "var(--color-sla8h)" },
      { sla: "sla1d", tickets: 4, fill: "var(--color-sla1d)" },
      { sla: "sla2d", tickets: 3, fill: "var(--color-sla2d)" },
      { sla: "sla3d", tickets: 2, fill: "var(--color-sla3d)" },
      { sla: "sla7d", tickets: 1, fill: "var(--color-sla7d)" },
    ]);
  });

  it("mapeia tickets encerrados dentro do SLA vs atrasados para o formato do gráfico EstimatedReal", () => {
    const resultado = mapSlaEstimadoVsRealParaGrafico({
      totalDentroDoSla: 10,
      totalAtrasado: 4,
      itens: [
        { sla: FAIXA_SLA_DASHBOARD.SLA_4H, label: "4 horas", dentroDoSla: 2, atrasado: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_8H, label: "8 horas", dentroDoSla: 1, atrasado: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_1D, label: "1 dia", dentroDoSla: 3, atrasado: 2 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_2D, label: "2 dias", dentroDoSla: 2, atrasado: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_3D, label: "3 dias", dentroDoSla: 1, atrasado: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_7D, label: "7 dias", dentroDoSla: 1, atrasado: 0 },
      ],
    });

    expect(resultado).toEqual([
      { sla: "4 horas", estimated: 2, real: 1 },
      { sla: "8 horas", estimated: 1, real: 0 },
      { sla: "1 dia", estimated: 3, real: 2 },
      { sla: "2 dias", estimated: 2, real: 1 },
      { sla: "3 dias", estimated: 1, real: 0 },
      { sla: "7 dias", estimated: 1, real: 0 },
    ]);
  });
});
