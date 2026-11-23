import { describe, expect, it } from "vitest";
import { hrefTicketsDashboard, parseIndicadorTickets } from "@/lib/dashboard-ticket-link";

describe("links dos indicadores do Dashboard", () => {
  it("leva o indicador e todo o recorte para a fila de tickets", () => {
    const filtros = {
      dataInicio: "2026-11-01", dataFim: "2026-11-30",
      clienteId: "c", usuarioId: "u", equipeId: "e", projetoId: "p",
    };
    const url = new URL(hrefTicketsDashboard(filtros, "foraDoSla"), "http://localhost");
    expect(url.pathname).toBe("/tickets");
    expect(Object.fromEntries(url.searchParams)).toEqual({ ...filtros, indicador: "foraDoSla" });
  });

  it("aceita somente indicadores conhecidos", () => {
    expect(parseIndicadorTickets("proximoDoSla")).toBe("proximoDoSla");
    expect(parseIndicadorTickets("constructor")).toBeUndefined();
    expect(parseIndicadorTickets(["total"])).toBeUndefined();
  });
});
