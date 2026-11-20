import {
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  Prioridade,
  Prisma,
  PrismaClient,
  StatusTicket,
} from "@/lib/generated/prisma/client";
import {
  ORDEM_STATUS_DASHBOARD,
  ORDEM_URGENCIA_DASHBOARD,
  ROTULO_STATUS_DASHBOARD,
  ROTULO_URGENCIA_DASHBOARD,
  type AgregacaoAbertosPorEquipeDashboard,
  type AgregacaoStatusDashboard,
  type AgregacaoUrgenciaDashboard,
  type AgregacoesVolumeStatusUrgenciaDashboard,
  type FiltrosDashboard,
  type ItemAbertosPorEquipe,
  type ItemAgregacaoStatus,
  type ItemAgregacaoUrgencia,
} from "@/types/dashboard";

export type CampoDataDashboard = "criadoEm" | "encerradoEm";

export interface OpcoesWhereDashboard {
  campoData?: CampoDataDashboard;
  base?: Prisma.TicketWhereInput;
}

function paraDia(valor?: string): Date | undefined {
  if (!valor) return undefined;
  const data = parseISO(valor);
  return isValid(data) ? data : undefined;
}

export function resolverIntervaloDatasDashboard(
  filtros?: Pick<FiltrosDashboard, "data" | "dataInicio" | "dataFim">,
): Prisma.DateTimeFilter<"Ticket"> | undefined {
  if (!filtros) return undefined;

  const inicioPeriodo = paraDia(filtros.dataInicio);
  const fimPeriodo = paraDia(filtros.dataFim);

  if (inicioPeriodo || fimPeriodo) {
    return {
      ...(inicioPeriodo ? { gte: startOfDay(inicioPeriodo) } : {}),
      ...(fimPeriodo ? { lte: endOfDay(fimPeriodo) } : {}),
    };
  }

  const diaUnico = paraDia(filtros.data);
  if (!diaUnico) return undefined;

  return {
    gte: startOfDay(diaUnico),
    lte: endOfDay(diaUnico),
  };
}

const DASHBOARD_DATE_FORMAT = "yyyy-MM-dd";

export function applyDefaultDashboardFilters(
  filters: FiltrosDashboard = {},
  referenceDate: Date = new Date(),
): FiltrosDashboard {
  if (filters.data || filters.dataInicio || filters.dataFim) {
    return { ...filters };
  }

  return {
    ...filters,
    dataInicio: format(startOfMonth(referenceDate), DASHBOARD_DATE_FORMAT),
    dataFim: format(endOfMonth(referenceDate), DASHBOARD_DATE_FORMAT),
  };
}

export function montarWhereDashboard(
  filtros?: FiltrosDashboard,
  opcoes: OpcoesWhereDashboard = {},
): Prisma.TicketWhereInput {
  const { campoData = "criadoEm", base } = opcoes;
  const filtrosWhere: Prisma.TicketWhereInput = {};

  if (filtros?.equipeId) {
    filtrosWhere.equipesAlocadas = {
      some: { equipeId: filtros.equipeId },
    };
  }

  if (filtros?.usuarioId) {
    filtrosWhere.OR = [
      { abertoPorId: filtros.usuarioId },
      { responsavelId: filtros.usuarioId },
      { historico: { some: { usuarioId: filtros.usuarioId } } },
    ];
  }

  if (filtros?.projetoId) {
    filtrosWhere.projetoId = filtros.projetoId;
  }

  if (filtros?.clienteId) {
    filtrosWhere.projeto = {
      clienteId: filtros.clienteId,
    };
  }

  const intervalo = resolverIntervaloDatasDashboard(filtros);
  if (intervalo) {
    if (campoData === "encerradoEm") {
      filtrosWhere.encerradoEm = intervalo;
    } else {
      filtrosWhere.criadoEm = intervalo;
    }
  }

  if (!base || Object.keys(base).length === 0) {
    return filtrosWhere;
  }

  if (Object.keys(filtrosWhere).length === 0) {
    return { ...base };
  }

  const chavesBase = new Set(Object.keys(base));
  const temConflito = Object.keys(filtrosWhere).some((chave) =>
    chavesBase.has(chave),
  );

  if (temConflito) {
    return { AND: [base, filtrosWhere] };
  }

  return {
    ...base,
    ...filtrosWhere,
  };
}

function montarAgregacaoStatus(
  grupos: Array<{ status: StatusTicket; _count: { _all: number } }>,
): AgregacaoStatusDashboard {
  const contagemPorStatus = new Map<StatusTicket, number>(
    grupos.map((grupo) => [grupo.status, grupo._count._all]),
  );

  const itens: ItemAgregacaoStatus[] = ORDEM_STATUS_DASHBOARD.map((status) => ({
    status,
    label: ROTULO_STATUS_DASHBOARD[status],
    quantidade: contagemPorStatus.get(status) ?? 0,
  }));

  const total = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const encerrados = contagemPorStatus.get(StatusTicket.ENCERRADO) ?? 0;
  const encerramentoSolicitado =
    contagemPorStatus.get(StatusTicket.SOLICITACAO_ENCERRAMENTO) ?? 0;

  return {
    total,
    abertos: total - encerrados,
    encerramentoSolicitado,
    itens,
  };
}

function montarAgregacaoUrgencia(
  grupos: Array<{ prioridade: Prioridade; _count: { _all: number } }>,
): AgregacaoUrgenciaDashboard {
  const contagemPorUrgencia = new Map<Prioridade, number>(
    grupos.map((grupo) => [grupo.prioridade, grupo._count._all]),
  );

  const itens: ItemAgregacaoUrgencia[] = ORDEM_URGENCIA_DASHBOARD.map(
    (prioridade) => ({
      prioridade,
      label: ROTULO_URGENCIA_DASHBOARD[prioridade],
      quantidade: contagemPorUrgencia.get(prioridade) ?? 0,
    }),
  );

  const total = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return {
    total,
    itens,
  };
}

export class ServicoDashboard {
  constructor(private readonly db: PrismaClient = prisma) {}

  async contarChamadosCriados(filtros?: FiltrosDashboard): Promise<number> {
    const where = montarWhereDashboard(filtros, { campoData: "criadoEm" });
    return this.db.ticket.count({ where });
  }

  async contarChamadosFechados(filtros?: FiltrosDashboard): Promise<number> {
    const where = montarWhereDashboard(filtros, {
      campoData: "encerradoEm",
      base: { status: StatusTicket.ENCERRADO },
    });
    return this.db.ticket.count({ where });
  }

  async agruparPorStatus(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoStatusDashboard> {
    const where = montarWhereDashboard(filtros, { campoData: "criadoEm" });
    const grupos = await this.db.ticket.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    return montarAgregacaoStatus(grupos);
  }

  async agruparAbertosPorEquipe(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoAbertosPorEquipeDashboard> {
    const whereTicketAberto = montarWhereDashboard(filtros, {
      campoData: "criadoEm",
      base: { status: { not: StatusTicket.ENCERRADO } },
    });

    const [totalAbertos, equipes] = await Promise.all([
      this.db.ticket.count({ where: whereTicketAberto }),
      this.buscarEquipesAbertas(filtros, whereTicketAberto),
    ]);

    return {
      totalAbertos,
      equipes,
    };
  }

  async agruparPorUrgencia(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacaoUrgenciaDashboard> {
    const where = montarWhereDashboard(filtros, { campoData: "criadoEm" });
    const grupos = await this.db.ticket.groupBy({
      by: ["prioridade"],
      where,
      _count: { _all: true },
    });

    return montarAgregacaoUrgencia(grupos);
  }

  async obterAgregacoesVolumeStatusUrgencia(
    filtros?: FiltrosDashboard,
  ): Promise<AgregacoesVolumeStatusUrgenciaDashboard> {
    const whereTicketAberto = montarWhereDashboard(filtros, {
      campoData: "criadoEm",
      base: { status: { not: StatusTicket.ENCERRADO } },
    });

    const [porStatus, fechados, equipesAbertas, porUrgencia] =
      await Promise.all([
        this.agruparPorStatus(filtros),
        this.contarChamadosFechados(filtros),
        this.buscarEquipesAbertas(filtros, whereTicketAberto),
        this.agruparPorUrgencia(filtros),
      ]);

    return {
      volume: {
        criados: porStatus.total,
        fechados,
        abertos: porStatus.abertos,
        encerramentoSolicitado: porStatus.encerramentoSolicitado,
      },
      porStatus,
      abertosPorEquipe: {
        totalAbertos: porStatus.abertos,
        equipes: equipesAbertas,
      },
      porUrgencia,
    };
  }

  async getDashboardAggregations(
    filters?: FiltrosDashboard,
    referenceDate: Date = new Date(),
  ): Promise<AgregacoesVolumeStatusUrgenciaDashboard> {
    return this.obterAgregacoesVolumeStatusUrgencia(
      applyDefaultDashboardFilters(filters, referenceDate),
    );
  }

  private async buscarEquipesAbertas(
    filtros: FiltrosDashboard | undefined,
    whereTicketAberto: Prisma.TicketWhereInput,
  ): Promise<ItemAbertosPorEquipe[]> {
    const grupos = await this.db.ticketEquipe.groupBy({
      by: ["equipeId"],
      where: {
        ticket: whereTicketAberto,
        ...(filtros?.equipeId ? { equipeId: filtros.equipeId } : {}),
      },
      _count: { _all: true },
    });

    const contagemPorEquipe = new Map<string, number>(
      grupos.map((grupo) => [grupo.equipeId, grupo._count._all]),
    );
    const idsComTickets = grupos.map((grupo) => grupo.equipeId);

    const equipes = await this.db.equipe.findMany({
      where: filtros?.equipeId
        ? { id: filtros.equipeId }
        : idsComTickets.length > 0
          ? { OR: [{ ativo: true }, { id: { in: idsComTickets } }] }
          : { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });

    return equipes.map((equipe) => ({
      equipeId: equipe.id,
      nome: equipe.nome,
      quantidade: contagemPorEquipe.get(equipe.id) ?? 0,
    }));
  }
}

export const servicoDashboard = new ServicoDashboard();
