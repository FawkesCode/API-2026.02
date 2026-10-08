import { afterEach, describe, expect, it, vi } from "vitest";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { servicoProjeto } from "@/lib/services/projeto.service";
import { RELACOES_TICKET } from "@/lib/services/ticket.service";

const projetoId = "550e8400-e29b-41d4-a716-446655440000";

afterEach(() => vi.restoreAllMocks());

describe("ServicoProjeto.listarTicketsPorProjeto", () => {
  it("mantém instalação no topo e ordena os demais por prioridade", async () => {
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

    expect(fila.map((ticket) => ticket.id)).toEqual(["baixa", "critica", "alta"]);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith({ where: { projetoId } });
  });
});

describe("ServicoProjeto.listarTicketsDoProjeto", () => {
  it("carrega as relações de equipe para exibir atribuições na lista do projeto", async () => {
    vi.spyOn(prisma.ticket, "findMany").mockResolvedValue([]);

    await servicoProjeto.listarTicketsDoProjeto(projetoId);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: { projetoId },
      orderBy: { criadoEm: "desc" },
      include: RELACOES_TICKET,
    });
  });

  it("ordena os tickets do projeto por prioridade, mantendo os mais novos primeiro em empates", async () => {
    vi.spyOn(prisma.ticket, "findMany").mockResolvedValue([
      { id: "media", prioridade: Prioridade.MEDIA, criadoEm: new Date("2026-09-25T12:00:00.000Z") },
      { id: "baixa", prioridade: Prioridade.BAIXA, criadoEm: new Date("2026-09-25T12:00:00.000Z") },
      { id: "critica-antiga", prioridade: Prioridade.CRITICA, criadoEm: new Date("2026-09-24T12:00:00.000Z") },
      { id: "critica-nova", prioridade: Prioridade.CRITICA, criadoEm: new Date("2026-09-25T12:00:00.000Z") },
      { id: "alta", prioridade: Prioridade.ALTA, criadoEm: new Date("2026-09-25T12:00:00.000Z") },
    ] as unknown as Awaited<ReturnType<typeof prisma.ticket.findMany>>);

    const resultado = await servicoProjeto.listarTicketsDoProjeto(projetoId);

    expect(resultado.map((ticket) => ticket.id)).toEqual([
      "critica-nova",
      "critica-antiga",
      "alta",
      "media",
      "baixa",
    ]);
  });
});
