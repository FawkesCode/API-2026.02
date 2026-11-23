"use client";

import { Clock8, Hourglass, Ticket, TriangleAlert } from "lucide-react";
import KpiCard from "./kpi-card";
import TicketsPerUrgency from "./tickets-per-urgency";
import ChartsCardContainer from "./charts-card-container";
import TicketsPerTeam from "./tickets-per-team";
import TicketsPerSla from "./tickets-per-sla";
import TicketsPerStatus from "./tickets-per-status";
import EstimatedReal from "./estimated-real";
import {
  mapEquipesParaGrafico,
  mapSlaEstimadoVsRealParaGrafico,
  mapSlaParaGrafico,
  mapStatusParaGrafico,
  mapUrgenciaParaGrafico,
} from "@/lib/mappers/dashboard.mapper";
import { hrefTicketsDashboard } from "@/lib/dashboard-ticket-link";
import type { AgregacoesVolumeStatusUrgenciaDashboard, FiltrosDashboard } from "@/types/dashboard";

interface DashboardViewProps {
  dados: AgregacoesVolumeStatusUrgenciaDashboard;
  filtros: FiltrosDashboard;
}

function DashboardView({ dados, filtros }: DashboardViewProps) {
  const {
    volume,
    porStatus,
    abertosPorEquipe,
    porUrgencia,
    porSla,
    resumoSla,
    slaEstimadoVsReal,
  } = dados;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex gap-4 flex-col 2xl:flex-row">
        <div className="flex flex-col w-full lg:grid lg:grid-cols-2 gap-3 shrink-0 2xl:w-auto 2xl:min-w-[60%]">
          <KpiCard
            title="Total de Tickets"
            qtd={volume.criados}
            icon={Ticket}
            href={hrefTicketsDashboard(filtros, "total")}
          />
          <KpiCard
            title="Encerramento Solicitado"
            qtd={volume.encerramentoSolicitado}
            icon={Hourglass}
            href={hrefTicketsDashboard(filtros, "encerramento")}
          />
          <KpiCard
            title="Fora do SLA"
            qtd={resumoSla.foraDoSla}
            icon={TriangleAlert}
            href={hrefTicketsDashboard(filtros, "foraDoSla")}
          />
          <KpiCard
            title="Próximo do SLA"
            qtd={resumoSla.proximoDoSla}
            icon={Clock8}
            href={hrefTicketsDashboard(filtros, "proximoDoSla")}
          />
        </div>
        <TicketsPerUrgency data={mapUrgenciaParaGrafico(porUrgencia)} />
      </section>

      <section className="flex gap-4 flex-col lg:flex-wrap lg:flex-row 2xl:flex-row">
        <ChartsCardContainer
          title="Tickets abertos por equipe"
          className=" w-full lg:min-w-120 lg:w-120 flex-1"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-6xl text-primary font-bold">
              {abertosPorEquipe.totalAbertos}
            </h2>
            <span className="text-muted-foreground w-[30%]">
              Tickets abertos
            </span>
          </div>
          <TicketsPerTeam data={mapEquipesParaGrafico(abertosPorEquipe)} />
        </ChartsCardContainer>

        <ChartsCardContainer
          title="Tickets por SLA"
          className=" justify-between lg:w-[50%] lg:ml-2 2xl:w-auto"
        >
          <TicketsPerSla data={mapSlaParaGrafico(porSla)} />
        </ChartsCardContainer>

        <ChartsCardContainer
          title="Tickets por Status"
          className="lg:w-[45%] 2xl:w-auto"
        >
          <TicketsPerStatus
            data={mapStatusParaGrafico(porStatus)}
            total={porStatus.total}
          />
        </ChartsCardContainer>
      </section>

      <section className="pb-8">
        <ChartsCardContainer
          title="SLA Estimado vs. Tempo Real"
          className="w-full 2xl:w-[50%]"
        >
          <EstimatedReal
            data={mapSlaEstimadoVsRealParaGrafico(slaEstimadoVsReal)}
          />
        </ChartsCardContainer>
      </section>
    </div>
  );
}

export default DashboardView;
