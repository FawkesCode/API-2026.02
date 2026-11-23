import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirSessao } from "@/auth/exigir-cargo";
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import { servicoDashboard } from "@/services/dashboard.service";

export class DashboardController {
  async getAggregations(request: Request) {
    const access = await exigirSessao(request);
    if (!access.autorizado) return access.resposta;

    const validation = validarFiltrosDashboard(
      new URL(request.url).searchParams,
    );
    if (!validation.success) {
      return NextResponse.json(
        {
          erro: "Parâmetros de filtro inválidos.",
          codigo: "FILTROS_INVALIDOS",
          detalhes: z.flattenError(validation.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    try {
      const aggregations = await servicoDashboard.getDashboardAggregations(
        validation.data,
      );
      return NextResponse.json(aggregations, { status: 200 });
    } catch (error) {
      console.error("[GET /api/dashboard] Erro ao carregar agregações:", error);
      return NextResponse.json(
        {
          erro: "Erro interno ao carregar indicadores do dashboard.",
          codigo: "ERRO_INTERNO",
        },
        { status: 500 },
      );
    }
  }
}

export const dashboardController = new DashboardController();
