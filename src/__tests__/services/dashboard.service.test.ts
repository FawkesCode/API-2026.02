import { endOfDay, parseISO, startOfDay } from "date-fns";
import { describe, expect, it, vi } from "vitest";
import { Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import {
  applyDefaultDashboardFilters,
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
    ticket: {
      count: vi.fn(),
      groupBy: vi.fn(),
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

describe("applyDefaultDashboardFilters", () => {
  const referenceDate = new Date(2026, 1, 15, 10, 30);

  it("aplica o mês vigente e todas as equipes quando nenhum filtro é informado", () => {
    expect(applyDefaultDashboardFilters(undefined, referenceDate)).toEqual({
      dataInicio: "2026-02-01",
      dataFim: "2026-02-28",
    });
    expect(applyDefaultDashboardFilters({}, referenceDate)).toEqual({
      dataInicio: "2026-02-01",
      dataFim: "2026-02-28",
    });
  });

  it("mantém os demais filtros ao aplicar o mês vigente", () => {
    expect(
      applyDefaultDashboardFilters(
        {
          equipeId: EQUIPE_A_ID,
          usuarioId: USUARIO_ID,
          projetoId: PROJETO_ID,
          clienteId: CLIENTE_ID,
        },
        referenceDate,
      ),
    ).toEqual({
      equipeId: EQUIPE_A_ID,
      usuarioId: USUARIO_ID,
      projetoId: PROJETO_ID,
      clienteId: CLIENTE_ID,
      dataInicio: "2026-02-01",
      dataFim: "2026-02-28",
    });
  });

  it("não aplica o mês vigente quando algum filtro de data é informado", () => {
    expect(
      applyDefaultDashboardFilters({ data: "2026-01-10" }, referenceDate),
    ).toEqual({ data: "2026-01-10" });
    expect(
      applyDefaultDashboardFilters({ dataInicio: "2026-01-01" }, referenceDate),
    ).toEqual({ dataInicio: "2026-01-01" });
    expect(
      applyDefaultDashboardFilters({ dataFim: "2026-01-31" }, referenceDate),
    ).toEqual({ dataFim: "2026-01-31" });
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

  it("agrupa chamados abertos por equipe sem duplicar totalAbertos e mantendo equipes ativas zeradas", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(7);
    banco.ticketEquipe.groupBy.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, _count: { _all: 5 } },
      { equipeId: EQUIPE_INATIVA_ID, _count: { _all: 3 } },
    ]);
    banco.equipe.findMany.mockResolvedValue([
      { id: EQUIPE_A_ID, nome: "Equipe A" },
      { id: EQUIPE_B_ID, nome: "Equipe B" },
      { id: EQUIPE_INATIVA_ID, nome: "Equipe Legada" },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparAbertosPorEquipe();

    expect(banco.ticket.count).toHaveBeenCalledWith({
      where: { status: { not: StatusTicket.ENCERRADO } },
    });
    expect(banco.ticketEquipe.groupBy).toHaveBeenCalledWith({
      by: ["equipeId"],
      where: {
        ticket: { status: { not: StatusTicket.ENCERRADO } },
      },
      _count: { _all: true },
    });
    expect(banco.equipe.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ativo: true },
          { id: { in: [EQUIPE_A_ID, EQUIPE_INATIVA_ID] } },
        ],
      },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
    expect(resultado).toEqual({
      totalAbertos: 7,
      equipes: [
        { equipeId: EQUIPE_A_ID, nome: "Equipe A", quantidade: 5 },
        { equipeId: EQUIPE_B_ID, nome: "Equipe B", quantidade: 0 },
        { equipeId: EQUIPE_INATIVA_ID, nome: "Equipe Legada", quantidade: 3 },
      ],
    });
  });

  it("isola somente a equipe selecionada em abertosPorEquipe quando equipeId é informado", async () => {
    const banco = criarBancoMock();
    banco.ticket.count.mockResolvedValue(3);
    banco.ticketEquipe.groupBy.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, _count: { _all: 3 } },
    ]);
    banco.equipe.findMany.mockResolvedValue([
      { id: EQUIPE_A_ID, nome: "Equipe A" },
    ]);
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);

    const resultado = await servico.agruparAbertosPorEquipe({
      equipeId: EQUIPE_A_ID,
    });

    expect(banco.ticketEquipe.groupBy).toHaveBeenCalledWith({
      by: ["equipeId"],
      where: {
        equipeId: EQUIPE_A_ID,
        ticket: {
          status: { not: StatusTicket.ENCERRADO },
          equipesAlocadas: { some: { equipeId: EQUIPE_A_ID } },
        },
      },
      _count: { _all: true },
    });
    expect(banco.equipe.findMany).toHaveBeenCalledWith({
      where: { id: EQUIPE_A_ID },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
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

  it("consolida volume, status, abertos por equipe e urgência sem consultas redundantes", async () => {
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
    banco.ticketEquipe.groupBy.mockResolvedValue([
      { equipeId: EQUIPE_A_ID, _count: { _all: 12 } },
      { equipeId: EQUIPE_B_ID, _count: { _all: 8 } },
    ]);
    banco.equipe.findMany.mockResolvedValue([
      { id: EQUIPE_A_ID, nome: "Equipe A" },
      { id: EQUIPE_B_ID, nome: "Equipe B" },
    ]);

    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);
    const resumo = await servico.obterAgregacoesVolumeStatusUrgencia({
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });

    expect(banco.ticket.count).toHaveBeenCalledTimes(1);
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
  });

  it("usa o mês vigente nas agregações do endpoint quando o período é omitido", async () => {
    const banco = criarBancoMock();
    const servico = new ServicoDashboard(banco as unknown as BancoDashboard);
    const obterAgregacoes = vi
      .spyOn(servico, "obterAgregacoesVolumeStatusUrgencia")
      .mockResolvedValue(
        {} as Awaited<
          ReturnType<ServicoDashboard["obterAgregacoesVolumeStatusUrgencia"]>
        >,
      );

    await servico.getDashboardAggregations(
      { projetoId: PROJETO_ID },
      new Date(2026, 10, 19),
    );

    expect(obterAgregacoes).toHaveBeenCalledWith({
      projetoId: PROJETO_ID,
      dataInicio: "2026-11-01",
      dataFim: "2026-11-30",
    });
  });
});
