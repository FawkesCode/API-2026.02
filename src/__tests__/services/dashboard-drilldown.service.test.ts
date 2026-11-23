import { describe, expect, it, vi } from "vitest";
import { ServicoDashboard } from "@/services/dashboard.service";
import { StatusTicket, type PrismaClient } from "@/lib/generated/prisma/client";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

describe("recorte da fila a partir do Dashboard", () => {
  const filtros = { equipeId: "e", clienteId: "c", usuarioId: "u", projetoId: "p", data: "2026-11-21" };
  const agora = new Date("2026-11-21T14:00:00Z");
  const hora = 3_600_000;
  const sla = (horas: number) => new Date(+agora + horas * hora);
  const base = { criadoEm: sla(-8), encerradoEm: null, status: StatusTicket.EM_ANDAMENTO };
  const tickets = [
    { ...base, id: "aberto-atrasado", slaEm: sla(0) },
    { ...base, id: "fechado-atrasado", slaEm: sla(-2), status: StatusTicket.ENCERRADO, encerradoEm: sla(-1) },
    { ...base, id: "alerta", slaEm: new Date(+agora + 1) },
    { ...base, id: "em-dia", slaEm: sla(15) },
    { ...base, id: "fechado-em-dia", slaEm: sla(1), status: StatusTicket.ENCERRADO, encerradoEm: sla(0) },
  ];
  const setup = () => {
    const findMany = vi.fn().mockResolvedValue(tickets);
    return { findMany, service: new ServicoDashboard({ ticket: { findMany } } as unknown as PrismaClient) };
  };

  it("combina os filtros do Dashboard ao status de encerramento", async () => {
    const { findMany, service } = setup();
    const where = await service.whereTicketsDoIndicador("encerramento", filtros, agora);
    expect(where).toMatchObject({
      status: StatusTicket.SOLICITACAO_ENCERRAMENTO, projetoId: "p", projeto: { clienteId: "c" },
      equipesAlocadas: { some: { equipeId: "e" } },
      OR: expect.arrayContaining([{ historico: { some: { usuarioId: "u" } } }]),
      criadoEm: { gte: expect.any(Date), lte: expect.any(Date) },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("usa as mesmas regras para os totais de SLA e os tickets do cartão", async () => {
    const { findMany, service } = setup();
    await expect(service.contarResumoSla(filtros, agora)).resolves.toEqual({ foraDoSla: 2, proximoDoSla: 1 });
    await expect(service.whereTicketsDoIndicador("foraDoSla", filtros, agora)).resolves.toMatchObject({
      id: { in: ["aberto-atrasado", "fechado-atrasado"] },
    });
    await expect(service.whereTicketsDoIndicador("proximoDoSla", filtros, agora)).resolves.toMatchObject({
      id: { in: ["alerta"] },
    });
    expect(findMany.mock.calls[0][0].where).toEqual(findMany.mock.calls[1][0].where);
  });
});
