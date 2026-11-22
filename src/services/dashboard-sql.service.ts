import { prisma } from "@/lib/prisma";
import { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { resolverIntervaloDatasDashboard } from "@/services/dashboard.service";
import type {
  FiltrosDashboard,
  ItemAbertosPorEquipe,
} from "@/types/dashboard";

export class ServicoDashboardSql {
  constructor(private readonly db: PrismaClient = prisma) {}

  async buscarAbertosPorEquipeComFunction(
    filtros?: FiltrosDashboard,
  ): Promise<ItemAbertosPorEquipe[]> {
    const intervalo = resolverIntervaloDatasDashboard(filtros);
    const usuarioId = filtros?.usuarioId ?? null;
    const projetoId = filtros?.projetoId ?? null;
    const clienteId = filtros?.clienteId ?? null;
    const dataInicio = intervalo?.gte instanceof Date ? intervalo.gte : null;
    const dataFim = intervalo?.lte instanceof Date ? intervalo.lte : null;

    const filtroEquipe = filtros?.equipeId
      ? Prisma.sql`WHERE e.id = ${filtros.equipeId}`
      : Prisma.empty;
    const filtroVisibilidade = filtros?.equipeId
      ? Prisma.empty
      : Prisma.sql`WHERE ativo = TRUE OR quantidade > 0`;

    const linhas = await this.db.$queryRaw<
      Array<{ equipeId: string; nome: string; quantidade: bigint | number }>
    >`
      SELECT equipeId, nome, quantidade
      FROM (
        SELECT
          e.id AS equipeId,
          e.nome AS nome,
          e.ativo AS ativo,
          fn_contar_abertos_equipe(
            e.id,
            ${usuarioId},
            ${projetoId},
            ${clienteId},
            ${dataInicio},
            ${dataFim}
          ) AS quantidade
        FROM equipes e
        ${filtroEquipe}
      ) AS resumo_equipes
      ${filtroVisibilidade}
      ORDER BY nome ASC
    `;

    return linhas.map((linha) => ({
      equipeId: linha.equipeId,
      nome: linha.nome,
      quantidade: Number(linha.quantidade),
    }));
  }

  async contarChamadosFechadosComProcedure(
    filtros?: FiltrosDashboard,
  ): Promise<number> {
    const intervalo = resolverIntervaloDatasDashboard(filtros);
    const equipeId = filtros?.equipeId ?? null;
    const usuarioId = filtros?.usuarioId ?? null;
    const projetoId = filtros?.projetoId ?? null;
    const clienteId = filtros?.clienteId ?? null;
    const dataInicio = intervalo?.gte instanceof Date ? intervalo.gte : null;
    const dataFim = intervalo?.lte instanceof Date ? intervalo.lte : null;

    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`
        CALL sp_contar_chamados_fechados(
          ${equipeId},
          ${usuarioId},
          ${projetoId},
          ${clienteId},
          ${dataInicio},
          ${dataFim},
          @total_chamados_fechados
        )
      `;

      const [linha] = await tx.$queryRaw<Array<{ total: bigint | number }>>`
        SELECT @total_chamados_fechados AS total
      `;

      return Number(linha?.total ?? 0);
    });
  }
}

export const servicoDashboardSql = new ServicoDashboardSql();
