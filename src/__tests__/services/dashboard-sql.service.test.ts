import { endOfDay, parseISO, startOfDay } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { ServicoDashboardSql } from "@/services/dashboard-sql.service";

type BancoDashboardSql = ConstructorParameters<typeof ServicoDashboardSql>[0];

const EQUIPE_A_ID = "550e8400-e29b-41d4-a716-446655440001";
const EQUIPE_B_ID = "550e8400-e29b-41d4-a716-446655440002";
const EQUIPE_INATIVA_ID = "550e8400-e29b-41d4-a716-446655440003";
const USUARIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const PROJETO_ID = "550e8400-e29b-41d4-a716-446655440020";
const CLIENTE_ID = "550e8400-e29b-41d4-a716-446655440030";

function criarBancoMock() {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn(),
  };

  return {
    $queryRaw: vi.fn(),
    $transaction: vi.fn(async (callback: (transacao: typeof tx) => unknown) =>
      callback(tx),
    ),
    tx,
  };
}

describe("ServicoDashboardSql", () => {
  it("busca chamados abertos por equipe via fn_contar_abertos_equipe convertendo BigInt", async () => {
    const banco = criarBancoMock();
    banco.$queryRaw.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: BigInt(5) },
      { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: BigInt(0) },
      {
        equipeId: EQUIPE_INATIVA_ID,
        nome: "Equipe Legada",
        quantidade: BigInt(3),
      },
    ]);
    const servico = new ServicoDashboardSql(
      banco as unknown as BancoDashboardSql,
    );

    const resultado = await servico.buscarAbertosPorEquipeComFunction();

    expect(banco.$queryRaw).toHaveBeenCalledTimes(1);
    const [sqlStrings, usuarioId, projetoId, clienteId, dataInicio, dataFim] =
      banco.$queryRaw.mock.calls[0];
    expect((sqlStrings as string[]).join("")).toContain(
      "fn_contar_abertos_equipe(",
    );
    expect([usuarioId, projetoId, clienteId, dataInicio, dataFim]).toEqual([
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(resultado).toEqual([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 5 },
      { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: 0 },
      { equipeId: EQUIPE_INATIVA_ID, nome: "Equipe Legada", quantidade: 3 },
    ]);
  });

  it("encaminha todos os filtros e isola a equipe selecionada em buscarAbertosPorEquipeComFunction", async () => {
    const banco = criarBancoMock();
    banco.$queryRaw.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 3 },
    ]);
    const servico = new ServicoDashboardSql(
      banco as unknown as BancoDashboardSql,
    );

    const resultado = await servico.buscarAbertosPorEquipeComFunction({
      equipeId: EQUIPE_A_ID,
      usuarioId: USUARIO_ID,
      projetoId: PROJETO_ID,
      clienteId: CLIENTE_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(banco.$queryRaw).toHaveBeenCalledTimes(1);
    const [
      ,
      usuarioId,
      projetoId,
      clienteId,
      dataInicio,
      dataFim,
      filtroEquipe,
    ] = banco.$queryRaw.mock.calls[0];
    expect(usuarioId).toBe(USUARIO_ID);
    expect(projetoId).toBe(PROJETO_ID);
    expect(clienteId).toBe(CLIENTE_ID);
    expect(dataInicio).toEqual(startOfDay(parseISO("2026-11-01")));
    expect(dataFim).toEqual(endOfDay(parseISO("2026-11-30")));
    expect(filtroEquipe.values).toEqual([EQUIPE_A_ID]);
    expect(resultado).toEqual([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 3 },
    ]);
  });

  it("conta chamados fechados via sp_contar_chamados_fechados com parâmetro OUT na mesma transação", async () => {
    const banco = criarBancoMock();
    banco.tx.$queryRaw.mockResolvedValue([{ total: BigInt(6) }]);
    const servico = new ServicoDashboardSql(
      banco as unknown as BancoDashboardSql,
    );

    const fechados = await servico.contarChamadosFechadosComProcedure({
      equipeId: EQUIPE_A_ID,
      usuarioId: USUARIO_ID,
      projetoId: PROJETO_ID,
      clienteId: CLIENTE_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(fechados).toBe(6);
    expect(banco.$transaction).toHaveBeenCalledTimes(1);
    expect(banco.tx.$executeRaw).toHaveBeenCalledTimes(1);
    const [
      callStrings,
      equipeId,
      usuarioId,
      projetoId,
      clienteId,
      dataInicio,
      dataFim,
    ] = banco.tx.$executeRaw.mock.calls[0];
    expect((callStrings as string[]).join("")).toContain(
      "CALL sp_contar_chamados_fechados(",
    );
    expect(equipeId).toBe(EQUIPE_A_ID);
    expect(usuarioId).toBe(USUARIO_ID);
    expect(projetoId).toBe(PROJETO_ID);
    expect(clienteId).toBe(CLIENTE_ID);
    expect(dataInicio).toEqual(startOfDay(parseISO("2026-11-01")));
    expect(dataFim).toEqual(endOfDay(parseISO("2026-11-30")));
    const [selectStrings] = banco.tx.$queryRaw.mock.calls[0];
    expect((selectStrings as string[]).join("")).toContain(
      "SELECT @total_chamados_fechados AS total",
    );
  });

  it("retorna 0 quando sp_contar_chamados_fechados não retorna linhas ou sem filtros", async () => {
    const banco = criarBancoMock();
    banco.tx.$queryRaw.mockResolvedValue([]);
    const servico = new ServicoDashboardSql(
      banco as unknown as BancoDashboardSql,
    );

    const fechados = await servico.contarChamadosFechadosComProcedure();

    expect(fechados).toBe(0);
    const [, equipeId, usuarioId, projetoId, clienteId, dataInicio, dataFim] =
      banco.tx.$executeRaw.mock.calls[0];
    expect([
      equipeId,
      usuarioId,
      projetoId,
      clienteId,
      dataInicio,
      dataFim,
    ]).toEqual([null, null, null, null, null, null]);
  });
});
