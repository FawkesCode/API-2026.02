import { afterEach, describe, expect, it, vi } from "vitest";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { servicoProjeto } from "@/lib/services/projeto.service";

const projetoId = "550e8400-e29b-41d4-a716-446655440000";

afterEach(() => vi.restoreAllMocks());

describe("ServicoProjeto.listarTicketsPorProjeto", () => {
  it("coloca o ticket de maior prioridade no topo da fila", async () => {
    const tickets = [
      {
        id: "baixa",
        prioridade: Prioridade.BAIXA,
        categoria: Categoria.INSTALACAO,
        criadoEm: new Date("2026-01-01T10:00:00.000Z"),
      },
      {
        id: "critica",
        prioridade: Prioridade.CRITICA,
        categoria: Categoria.MANUTENCAO,
        criadoEm: new Date("2026-01-01T11:00:00.000Z"),
      },
      {
        id: "alta",
        prioridade: Prioridade.ALTA,
        categoria: Categoria.MANUTENCAO,
        criadoEm: new Date("2026-01-01T09:00:00.000Z"),
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.ticket.findMany>>;
    vi.spyOn(prisma.ticket, "findMany").mockResolvedValue(tickets);

    const fila = await servicoProjeto.listarTicketsPorProjeto(projetoId);

    expect(fila.map((ticket) => ticket.id)).toEqual(["critica", "alta", "baixa"]);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith({ where: { projetoId } });
  });
});
