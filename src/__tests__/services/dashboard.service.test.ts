import { endOfDay, parseISO, startOfDay } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import { FAIXA_SLA_DASHBOARD } from "@/types/dashboard";
import {
  classificarFaixaSla,
  montarWhereDashboard,
  resolverIntervaloDatasDashboard,
  ServicoDashboard,
} from "@/services/dashboard.service";

type BancoDashboard = ConstructorParameters<typeof ServicoDashboard>[0];

const EQUIPE_A_ID = "550e8400-e29b-41d4-a716-446655440001";
const EQUIPE_B_ID = "550e8400-e29b-41d4-a716-446655440002";
const EQUIPE_INATIVA_ID = "550e8400-e29b-41d4-a716-446655440003";
const USUARIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const PROJETO_ID = "550e8400-e29b-41d4-a716-446655440020";
const CLIENTE_ID = "550e8400-e29b-41d4-a716-446655440030";

function criarBancoMock() {
  return {
''    $queryRaw: vi.fn(),
    ticket: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    ticketEquipe: {
      groupBy: vi.fn(),
    },
    equipe: {
      findMany: vi.fn(),
    },
  };
}

describe("resolverIntervaloDatasDashboard", () => {
  it("retorna undefined quando nenhuma data é informada", () => {
    expect(resolverIntervaloDatasDashboard()).toBeUndefined();
    expect(resolverIntervaloDatasDashboard({})).toBeUndefined();
  });

  it("gera intervalo do início ao fim do dia para filtro por data única", () => {
    const intervalo = resolverIntervaloDatasDashboard({ data: "2026-11-10" });
    const referencia = parseISO("2026-11-10");

    expect(intervalo).toEqual({
      gte: startOfDay(referencia),
      lte: endOfDay(referencia),
    });
  });

  it("gera intervalo inclusivo nas pontas para período dataInicio..dataFim", () => {
    const intervalo = resolverIntervaloDatasDashboard({
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(intervalo).toEqual({
      gte: startOfDay(parseISO("2026-11-01")),
      lte: endOfDay(parseISO("2026-11-30")),
    });
  });

  it("suporta intervalo aberto quando apenas uma ponta é fornecida", () => {
    expect(
      resolverIntervaloDatasDashboard({ dataInicio: "2026-11-01" }),
    ).toEqual({
      gte: startOfDay(parseISO("2026-11-01")),
    });

    expect(resolverIntervaloDatasDashboard({ dataFim: "2026-11-30" })).toEqual({
      lte: endOfDay(parseISO("2026-11-30")),
    });
  });
});

describe("montarWhereDashboard", () => {
  it("aplica todos os filtros suportados pelo dashboard", () => {
    const where = montarWhereDashboard({
      equipeId: EQUIPE_A_ID,
      usuarioId: USUARIO_ID,
      projetoId: PROJETO_ID,
      clienteId: CLIENTE_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(where).toEqual({
      equipesAlocadas: { some: { equipeId: EQUIPE_A_ID } },
      OR: [
        { abertoPorId: USUARIO_ID },
        { responsavelId: USUARIO_ID },
        { historico: { some: { usuarioId: USUARIO_ID } } },
      ],
      projetoId: PROJETO_ID,
      projeto: { clienteId: CLIENTE_ID },
      criadoEm: {
        gte: startOfDay(parseISO("2026-11-01")),
        lte: endOfDay(parseISO("2026-11-30")),
      },
    });
  });

  it("aplica o filtro de data sobre encerradoEm quando solicitado", () => {
    const where = montarWhereDashboard(
      { data: "2026-11-15", clienteId: CLIENTE_ID },
      { campoData: "encerradoEm", base: { status: StatusTicket.ENCERRADO } },
    );

    expect(where).toEqual({
      status: StatusTicket.ENCERRADO,
      projeto: { clienteId: CLIENTE_ID },
      encerradoEm: {
        gte: startOfDay(parseISO("2026-11-15")),
        lte: endOfDay(parseISO("2026-11-15")),
      },
    });
  });

  it("usa AND para evitar sobrescrever chaves conflitantes entre base e filtros", () => {
    const where = montarWhereDashboard(
      { usuarioId: USUARIO_ID },
      { base: { OR: [{ status: StatusTicket.EM_ANDAMENTO }] } },
    );

    expect(where).toEqual({
      AND: [
        { OR: [{ status: StatusTicket.EM_ANDAMENTO }] },
        {
          OR: [
            { abertoPorId: USUARIO_ID },
            { responsavelId: USUARIO_ID },
            { historico: { some: { usuarioId: USUARIO_ID } } },
          ],
        },
      ],
    });
  });
});

describe("ServicoDashboard", () => {
  it("conta chamados criados respeitando todos os filtros aplicados", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(14);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const total = await servico.contarChamadosCriados({
      projetoId: PROJETO_ID,
      data: "2026-11-10",
    });

    expect(total).toBe(14);
    expect(banco.ticket.count).toHaveBeenCalledWith({
      where: {
        projetoId: PROJETO_ID,
        criadoEm: {
          gte: startOfDay(parseISO("2026-11-10")),
          lte: endOfDay(parseISO("2026-11-10")),
        },
      },
    });
  });

  it("conta chamados fechados filtrando status ENCERRADO e encerradoEm no período", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(6);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const fechados = await servico.contarChamadosFechados({
      equipeId: EQUIPE_A_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(fechados).toBe(6);
    expect(banco.ticket.count).toHaveBeenCalledWith({
      where: {
        status: StatusTicket.ENCERRADO,
        equipesAlocadas: { some: { equipeId: EQUIPE_A_ID } },
        encerradoEm: {
          gte: startOfDay(parseISO("2026-11-01")),
          lte: endOfDay(parseISO("2026-11-30")),
        },
      },
    });
  });

  it("agrupa por status preenchendo com zero os status ausentes e derivando totais", async () => {
    const banco = criarBancoMock();
    banco.ticket.groupBy.mockResolvedValue([
      { status: StatusTicket.EM_ANDAMENTO, _count: { _all: 12 } },
      { status: StatusTicket.SOLICITACAO_ENCERRAMENTO, _count: { _all: 4 } },
      { status: StatusTicket.ENCERRADO, _count: { _all: 9 } },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparPorStatus({ clienteId: CLIENTE_ID });

    expect(banco.ticket.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { projeto: { clienteId: CLIENTE_ID } },
      _count: { _all: true },
    });
    expect(resultado).toEqual({
      total: 25,
      abertos: 16,
      encerramentoSolicitado: 4,
      itens: [
        {
          status: StatusTicket.NAO_INICIADO,
          label: "Não iniciado",
          quantidade: 0,
        },
        {
          status: StatusTicket.EM_ANDAMENTO,
          label: "Em andamento",
          quantidade: 12,
        },
        {
          status: StatusTicket.SOLICITACAO_ENCERRAMENTO,
          label: "Encerramento solicitado",
          quantidade: 4,
        },
        {
          status: StatusTicket.EM_REVISAO,
          label: "Em revisão",
          quantidade: 0,
        },
        {
          status: StatusTicket.ENCERRADO,
          label: "Encerrado",
          quantidade: 9,
        },
      ],
    });
  });

  it("agrupa chamados abertos por equipe usando fn_contar_abertos_equipe e convertendo BigInt", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(7);
    banco.$queryRaw.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: BigInt(5) },
      { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: BigInt(0) },
      {
        equipeId: EQUIPE_INATIVA_ID,
        nome: "Equipe Legada",
        quantidade: BigInt(3),
      },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparAbertosPorEquipe();

    expect(banco.ticket.count).toHaveBeenCalledWith({
      where: { status: { not: StatusTicket.ENCERRADO } },
    });
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
    expect(resultado).toEqual({
      totalAbertos: 7,
      equipes: [
        { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 5 },
        { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: 0 },
        { equipeId: EQUIPE_INATIVA_ID, nome: "Equipe Legada", quantidade: 3 },
      ],
    });
  });

  it("isola somente a equipe selecionada e encaminha todos os filtros para fn_contar_abertos_equipe", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(3);
    banco.$queryRaw.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 3 },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparAbertosPorEquipe({
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
    expect(resultado).toEqual({
      totalAbertos: 3,
      equipes: [{ equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 3 }],
    });
  });

  it("agrupa por urgência na ordem Crítica -> Alta -> Média -> Baixa preenchendo zeros", async () => {
    const banco = criarBancoMock();
    banco.ticket.groupBy.mockResolvedValue([
      { prioridade: Prioridade.BAIXA, _count: { _all: 7 } },
      { prioridade: Prioridade.CRITICA, _count: { _all: 3 } },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparPorUrgencia({
      usuarioId: USUARIO_ID,
    });

    expect(banco.ticket.groupBy).toHaveBeenCalledWith({
      by: ["prioridade"],
      where: {
        OR: [
          { abertoPorId: USUARIO_ID },
          { responsavelId: USUARIO_ID },
          { historico: { some: { usuarioId: USUARIO_ID } } },
        ],
      },
      _count: { _all: true },
    });
    expect(resultado).toEqual({
      total: 10,
      itens: [
        { prioridade: Prioridade.CRITICA, label: "Crítica", quantidade: 3 },
        { prioridade: Prioridade.ALTA, label: "Alta", quantidade: 0 },
        { prioridade: Prioridade.MEDIA, label: "Média", quantidade: 0 },
        { prioridade: Prioridade.BAIXA, label: "Baixa", quantidade: 7 },
      ],
    });
  });

  it("classifica corretamente as faixas de SLA incluindo tolerância de cadastro", () => {
    const base = new Date("2026-11-10T10:00:00.000Z");
    const adicionarHoras = (horas: number, minutosExtras = 0) =>
      new Date(base.getTime() + horas * 60 * 60 * 1000 + minutosExtras * 60 * 1000);

    expect(classificarFaixaSla(base, adicionarHoras(4, -1))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_4H,
    );
    expect(classificarFaixaSla(base, adicionarHoras(4, 3))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_4H,
    );
    expect(classificarFaixaSla(base, adicionarHoras(8))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_8H,
    );
    expect(classificarFaixaSla(base, adicionarHoras(24))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_1D,
    );
    expect(classificarFaixaSla(base, adicionarHoras(48))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_2D,
    );
    expect(classificarFaixaSla(base, adicionarHoras(72))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_3D,
    );
    expect(classificarFaixaSla(base, adicionarHoras(168))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_7D,
    );
    expect(classificarFaixaSla(base, adicionarHoras(216))).toBe(
      FAIXA_SLA_DASHBOARD.SLA_7D,
    );
  });

  it("agrupa chamados por SLA em 4 horas, 8 horas, 1 dia, 2 dias, 3 dias e 7 dias preenchendo zeros", async () => {
    const base = new Date("2026-11-10T10:00:00.000Z");
    const adicionarHoras = (horas: number) =>
      new Date(base.getTime() + horas * 60 * 60 * 1000);

    const banco = criarBancoMock();
    banco.ticket.findMany.mockResolvedValue([
      { criadoEm: base, slaEm: adicionarHoras(4) },
      { criadoEm: base, slaEm: adicionarHoras(4) },
      { criadoEm: base, slaEm: adicionarHoras(8) },
      { criadoEm: base, slaEm: adicionarHoras(24) },
      { criadoEm: base, slaEm: adicionarHoras(72) },
      { criadoEm: base, slaEm: adicionarHoras(168) },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparPorSla({ projetoId: PROJETO_ID });

    expect(banco.ticket.findMany).toHaveBeenCalledWith({
      where: { projetoId: PROJETO_ID },
      select: { criadoEm: true, slaEm: true },
    });
    expect(resultado).toEqual({
      total: 6,
      itens: [
        { sla: FAIXA_SLA_DASHBOARD.SLA_4H, label: "4 horas", quantidade: 2 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_8H, label: "8 horas", quantidade: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_1D, label: "1 dia", quantidade: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_2D, label: "2 dias", quantidade: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_3D, label: "3 dias", quantidade: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_7D, label: "7 dias", quantidade: 1 },
      ],
    });
  });

  it("conta tickets fora do SLA e próximos do SLA respeitando a janela de alerta", async () => {
    const agora = new Date("2026-11-10T12:00:00.000Z");
    const adicionarHoras = (origem: Date, horas: number) =>
      new Date(origem.getTime() + horas * 60 * 60 * 1000);

    const banco = criarBancoMock();
    banco.ticket.findMany.mockResolvedValue([
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: new Date("2026-11-10T06:00:00.000Z"),
        slaEm: new Date("2026-11-10T10:00:00.000Z"),
        encerradoEm: null,
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: new Date("2026-11-09T10:00:00.000Z"),
        slaEm: new Date("2026-11-10T10:00:00.000Z"),
        encerradoEm: new Date("2026-11-10T11:00:00.000Z"),
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: new Date("2026-11-09T10:00:00.000Z"),
        slaEm: new Date("2026-11-10T10:00:00.000Z"),
        encerradoEm: new Date("2026-11-10T09:00:00.000Z"),
      },
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: new Date("2026-11-10T08:30:00.000Z"),
        slaEm: new Date("2026-11-10T12:30:00.000Z"),
        encerradoEm: null,
      },
      {
        status: StatusTicket.NAO_INICIADO,
        criadoEm: new Date("2026-11-10T00:00:00.000Z"),
        slaEm: adicionarHoras(agora, 36),
        encerradoEm: null,
      },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.contarResumoSla(
      { equipeId: EQUIPE_A_ID },
      agora,
    );

    expect(banco.ticket.findMany).toHaveBeenCalledWith({
      where: { equipesAlocadas: { some: { equipeId: EQUIPE_A_ID } } },
      select: {
        status: true,
        criadoEm: true,
        slaEm: true,
        encerradoEm: true,
      },
    });
    expect(resultado).toEqual({
      foraDoSla: 2,
      proximoDoSla: 1,
    });
  });

  it("agrupa tickets encerrados dentro do SLA versus atrasados por faixa de SLA", async () => {
    const base = new Date("2026-11-10T10:00:00.000Z");
    const adicionarHoras = (horas: number) =>
      new Date(base.getTime() + horas * 60 * 60 * 1000);

    const banco = criarBancoMock();
    banco.ticket.findMany.mockResolvedValue([
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: base,
        slaEm: adicionarHoras(4),
        encerradoEm: adicionarHoras(6),
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: base,
        slaEm: adicionarHoras(24),
        encerradoEm: adicionarHoras(20),
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: base,
        slaEm: adicionarHoras(4),
        encerradoEm: adicionarHoras(4),
      },
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: base,
        slaEm: adicionarHoras(48),
        encerradoEm: null,
      },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparSlaEstimadoVsReal({
      clienteId: CLIENTE_ID,
    });

    expect(resultado).toEqual({
      totalDentroDoSla: 2,
      totalAtrasado: 1,
      itens: [
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_4H,
          label: "4 horas",
          dentroDoSla: 1,
          atrasado: 1,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_8H,
          label: "8 horas",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_1D,
          label: "1 dia",
          dentroDoSla: 1,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_2D,
          label: "2 dias",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_3D,
          label: "3 dias",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_7D,
          label: "7 dias",
          dentroDoSla: 0,
          atrasado: 0,
        },
      ],
    });
  });

  it("consolida volume, status, abertos por equipe, urgência e métricas de SLA sem consultas redundantes", async () => {
    const base = new Date("2026-11-10T10:00:00.000Z");
    const agora = new Date("2026-11-10T15:00:00.000Z");
    const adicionarHoras = (horas: number) =>
      new Date(base.getTime() + horas * 60 * 60 * 1000);

    const banco = criarBancoMock();
    banco.ticket.groupBy
      .mockResolvedValueOnce([
        { status: StatusTicket.NAO_INICIADO, _count: { _all: 5 } },
        { status: StatusTicket.EM_ANDAMENTO, _count: { _all: 10 } },
        { status: StatusTicket.SOLICITACAO_ENCERRAMENTO, _count: { _all: 3 } },
        { status: StatusTicket.EM_REVISAO, _count: { _all: 2 } },
        { status: StatusTicket.ENCERRADO, _count: { _all: 8 } },
      ])
      .mockResolvedValueOnce([
        { prioridade: Prioridade.CRITICA, _count: { _all: 4 } },
        { prioridade: Prioridade.ALTA, _count: { _all: 9 } },
        { prioridade: Prioridade.MEDIA, _count: { _all: 10 } },
        { prioridade: Prioridade.BAIXA, _count: { _all: 5 } },
      ]);
    banco.ticket.count.mockResolvedValue(11);
    banco.ticket.findMany.mockResolvedValue([
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: base,
        slaEm: adicionarHoras(4),
        encerradoEm: null,
      },
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: base,
        slaEm: adicionarHoras(48),
        encerradoEm: null,
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: base,
        slaEm: adicionarHoras(168),
        encerradoEm: adicionarHoras(24),
      },
    ]);
    banco.$queryRaw.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: BigInt(12) },
      { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: BigInt(8) },
    ]);

    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);
    const resumo = await servico.obterAgregacoesVolumeStatusUrgencia(
      {
        dataInicio: "2026-11-01",
        dataFim: "2026-11-30",
      },
      agora,
    );

    expect(banco.ticket.count).toHaveBeenCalledTimes(1);
    expect(banco.ticket.findMany).toHaveBeenCalledTimes(1);
    expect(resumo.volume).toEqual({
      criados: 28,
      fechados: 11,
      abertos: 20,
      encerramentoSolicitado: 3,
    });
    expect(resumo.porStatus.total).toBe(28);
    expect(resumo.abertosPorEquipe).toEqual({
      totalAbertos: 20,
      equipes: [
        { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 12 },
        { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: 8 },
      ],
    });
    expect(resumo.porUrgencia).toEqual({
      total: 28,
      itens: [
        { prioridade: Prioridade.CRITICA, label: "Crítica", quantidade: 4 },
        { prioridade: Prioridade.ALTA, label: "Alta", quantidade: 9 },
        { prioridade: Prioridade.MEDIA, label: "Média", quantidade: 10 },
        { prioridade: Prioridade.BAIXA, label: "Baixa", quantidade: 5 },
      ],
    });
    expect(resumo.porSla).toEqual({
      total: 3,
      itens: [
        { sla: FAIXA_SLA_DASHBOARD.SLA_4H, label: "4 horas", quantidade: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_8H, label: "8 horas", quantidade: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_1D, label: "1 dia", quantidade: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_2D, label: "2 dias", quantidade: 1 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_3D, label: "3 dias", quantidade: 0 },
        { sla: FAIXA_SLA_DASHBOARD.SLA_7D, label: "7 dias", quantidade: 1 },
      ],
    });
    expect(resumo.resumoSla).toEqual({
      foraDoSla: 1,
      proximoDoSla: 0,
    });
    expect(resumo.slaEstimadoVsReal).toEqual({
      totalDentroDoSla: 1,
      totalAtrasado: 0,
      itens: [
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_4H,
          label: "4 horas",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_8H,
          label: "8 horas",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_1D,
          label: "1 dia",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_2D,
          label: "2 dias",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_3D,
          label: "3 dias",
          dentroDoSla: 0,
          atrasado: 0,
        },
        {
          sla: FAIXA_SLA_DASHBOARD.SLA_7D,
          label: "7 dias",
          dentroDoSla: 1,
          atrasado: 0,
        },
      ],
    });
  });

  it("trata corretamente base vazia e casos de borda de SLA", async () => {
    const agora = new Date("2026-11-10T12:00:00.000Z");
    const banco = criarBancoMock();
    banco.ticket.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    banco.ticket.count.mockResolvedValue(0);
    banco.ticket.findMany.mockResolvedValue([]);
    banco.$queryRaw.mockResolvedValue([]);

    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);
    const vazio = await servico.obterAgregacoesVolumeStatusUrgencia({}, agora);

    expect(vazio.volume).toEqual({
      criados: 0,
      fechados: 0,
      abertos: 0,
      encerramentoSolicitado: 0,
    });
    expect(vazio.porStatus.itens).toHaveLength(5);
    expect(vazio.porUrgencia.itens).toHaveLength(4);
    expect(vazio.porSla.itens).toHaveLength(6);
    expect(vazio.resumoSla).toEqual({ foraDoSla: 0, proximoDoSla: 0 });
    expect(vazio.slaEstimadoVsReal.totalDentroDoSla).toBe(0);
    expect(vazio.slaEstimadoVsReal.totalAtrasado).toBe(0);

    banco.ticket.findMany.mockResolvedValueOnce([
      {
        status: StatusTicket.EM_ANDAMENTO,
        criadoEm: new Date("2026-11-10T08:00:00.000Z"),
        slaEm: agora,
        encerradoEm: null,
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: new Date("2026-11-10T08:00:00.000Z"),
        slaEm: agora,
        encerradoEm: agora,
      },
      {
        status: StatusTicket.ENCERRADO,
        criadoEm: new Date("2026-11-10T08:00:00.000Z"),
        slaEm: new Date("2026-11-10T10:00:00.000Z"),
        encerradoEm: null,
      },
    ]);

    const bordas = await servico.contarResumoSla({}, agora);
    expect(bordas).toEqual({ foraDoSla: 1, proximoDoSla: 0 });

    expect(
      classificarFaixaSla(
        new Date("2026-11-10T12:00:00.000Z"),
        new Date("2026-11-10T11:00:00.000Z"),
      ),
    ).toBe(FAIXA_SLA_DASHBOARD.SLA_4H);
  });
});
