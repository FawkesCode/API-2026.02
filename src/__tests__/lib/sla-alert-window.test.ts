import { describe, expect, it } from "vitest";
import { janelaAlertaSlaMs } from "@/lib/sla-alert-window";

const HORA = 60 * 60 * 1000;
const criadoEm = new Date("2026-11-19T12:00:00.000Z");

describe("janela de alerta do SLA", () => {
  it.each([
    [4, 1],
    [8, 2],
    [24, 4],
    [48, 24],
    [72, 24],
    [168, 24],
  ])("para SLA de %i horas, alerta nas últimas %i horas", (slaHoras, alertaHoras) => {
    const slaEm = new Date(criadoEm.getTime() + slaHoras * HORA - 30_000);
    expect(janelaAlertaSlaMs(criadoEm, slaEm)).toBe(alertaHoras * HORA);
  });

  it("mantém 1 dia como janela para um SLA superior a 1 dia", () => {
    const slaEm = new Date(criadoEm.getTime() + 30 * HORA);
    expect(janelaAlertaSlaMs(criadoEm, slaEm)).toBe(24 * HORA);
  });
});
