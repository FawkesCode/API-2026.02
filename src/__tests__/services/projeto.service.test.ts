import { afterEach, describe, expect, it, vi } from "vitest";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { Categoria, Prioridade } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { servicoProjeto } from "@/services/projeto.service";
import { RELACOES_TICKET } from "@/services/ticket.service";

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

    expect(fila.map((ticket) => ticket.id)).toEqual([
      "baixa",
      "critica",
      "alta",
    ]);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: { projetoId },
    });
  });
});

describe("ServicoProjeto.listarTicketsDoProjeto", () => {
  it("carrega as relações de equipe para exibir atribuições na lista do projeto", async () => {
    vi.spyOn(prisma.ticket, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.ticket, "count").mockResolvedValue(0);

    await servicoProjeto.listarTicketsDoProjeto(projetoId);

    expect(prisma.ticket.findMany).toHaveBeenCalledWith({
      where: { projetoId },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip: 0,
      take: 5,
      include: RELACOES_TICKET,
    });
  });

  it("aplica o período inclusivo sem perder o escopo do projeto", async () => {
    const count = vi.spyOn(prisma.ticket, "count").mockResolvedValue(6);
    const findMany = vi.spyOn(prisma.ticket, "findMany").mockResolvedValue([]);
    await servicoProjeto.listarTicketsDoProjeto(projetoId, {
      dataInicio: "2026-09-24",
      dataFim: "2026-09-25",
      pagina: 2,
      itensPorPagina: 5,
    });

    const where = {
      projetoId,
      criadoEm: { gte: startOfDay(parseISO("2026-09-24")), lte: endOfDay(parseISO("2026-09-25")) },
    };
    expect(count).toHaveBeenCalledWith({ where });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip: 5,
      take: 5,
    }));
  });

  it("retorna os itens paginados fornecidos pelo banco", async () => {
    vi.spyOn(prisma.ticket, "count").mockResolvedValue(5);
    vi.spyOn(prisma.ticket, "findMany").mockResolvedValue([
      {
        id: "media",
        prioridade: Prioridade.MEDIA,
        criadoEm: new Date("2026-09-25T12:00:00.000Z"),
      },
      {
        id: "baixa",
        prioridade: Prioridade.BAIXA,
        criadoEm: new Date("2026-09-25T12:00:00.000Z"),
      },
      {
        id: "critica-antiga",
        prioridade: Prioridade.CRITICA,
        criadoEm: new Date("2026-09-24T12:00:00.000Z"),
      },
      {
        id: "critica-nova",
        prioridade: Prioridade.CRITICA,
        criadoEm: new Date("2026-09-25T12:00:00.000Z"),
      },
      {
        id: "alta",
        prioridade: Prioridade.ALTA,
        criadoEm: new Date("2026-09-25T12:00:00.000Z"),
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.ticket.findMany>>);

    const resultado = await servicoProjeto.listarTicketsDoProjeto(projetoId);

    expect(resultado.total).toBe(5);
    expect(resultado.itens.map((ticket) => ticket.id)).toEqual([
      "media",
      "baixa",
      "critica-antiga",
      "critica-nova",
      "alta",
    ]);
  });
});
