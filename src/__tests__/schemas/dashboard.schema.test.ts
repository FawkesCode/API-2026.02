import { describe, expect, it } from "vitest";
import {
  filtrosDashboardSchema,
  validarFiltrosDashboard,
} from "@/schemas/dashboard.schema";

const EQUIPE_ID = "550e8400-e29b-41d4-a716-446655440001";
const USUARIO_ID = "550e8400-e29b-41d4-a716-446655440002";
const PROJETO_ID = "550e8400-e29b-41d4-a716-446655440003";
const CLIENTE_ID = "550e8400-e29b-41d4-a716-446655440004";

describe("filtrosDashboardSchema", () => {
  it("aceita objeto vazio representando todas as equipes e todos os períodos", () => {
    const resultado = filtrosDashboardSchema.safeParse({});
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({
        equipeId: undefined,
        usuarioId: undefined,
        projetoId: undefined,
        clienteId: undefined,
        data: undefined,
        dataInicio: undefined,
        dataFim: undefined,
      });
    }
  });

  it("interpreta equipeId='todas' (ou vazio) como ausência de filtro de equipe", () => {
    const comTodas = filtrosDashboardSchema.safeParse({ equipeId: "todas" });
    const comTodasMaiusculo = filtrosDashboardSchema.safeParse({
      equipeId: "TODAS",
    });
    const comVazio = filtrosDashboardSchema.safeParse({ equipeId: "   " });

    expect(comTodas.success).toBe(true);
    expect(comTodasMaiusculo.success).toBe(true);
    expect(comVazio.success).toBe(true);
    if (comTodas.success && comTodasMaiusculo.success && comVazio.success) {
      expect(comTodas.data.equipeId).toBeUndefined();
      expect(comTodasMaiusculo.data.equipeId).toBeUndefined();
      expect(comVazio.data.equipeId).toBeUndefined();
    }
  });

  it("valida todos os filtros combinados a partir de URLSearchParams", () => {
    const params = new URLSearchParams({
      equipeId: EQUIPE_ID,
      usuarioId: USUARIO_ID,
      projetoId: PROJETO_ID,
      clienteId: CLIENTE_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    const resultado = validarFiltrosDashboard(params);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({
        equipeId: EQUIPE_ID,
        usuarioId: USUARIO_ID,
        projetoId: PROJETO_ID,
        clienteId: CLIENTE_ID,
        data: undefined,
        dataInicio: "2026-11-01",
        dataFim: "2026-11-30",
      });
    }
  });

  it("rejeita UUIDs inválidos nos filtros de entidade", () => {
    const resultado = filtrosDashboardSchema.safeParse({
      equipeId: "equipe-invalida",
      usuarioId: "123",
      projetoId: "abc",
      clienteId: "xyz",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita datas com formato inválido ou inexistentes no calendário", () => {
    expect(
      filtrosDashboardSchema.safeParse({ data: "19/11/2026" }).success,
    ).toBe(false);
    expect(
      filtrosDashboardSchema.safeParse({ data: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      filtrosDashboardSchema.safeParse({ dataInicio: "2026-13-01" }).success,
    ).toBe(false);
  });

  it("rejeita intervalo quando dataFim é anterior a dataInicio", () => {
    const resultado = filtrosDashboardSchema.safeParse({
      dataInicio: "2026-11-20",
      dataFim: "2026-11-10",
    });

    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.path).toEqual(["dataFim"]);
    }
  });

  it("aceita searchParams como objeto com arrays pegando o primeiro valor", () => {
    const resultado = validarFiltrosDashboard({
      projetoId: [PROJETO_ID, CLIENTE_ID],
      data: ["2026-11-15"],
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.projetoId).toBe(PROJETO_ID);
      expect(resultado.data.data).toBe("2026-11-15");
    }
  });
});
