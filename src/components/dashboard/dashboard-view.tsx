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
import type { AgregacoesVolumeStatusUrgenciaDashboard } from "@/types/dashboard";

interface DashboardViewProps {
  dados: AgregacoesVolumeStatusUrgenciaDashboard;
}

function DashboardView({ dados }: DashboardViewProps) {
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
      <section className="flex gap-4 ">
        <div className="grid grid-cols-2 gap-3 shrink-0 min-w-[60%]">
          <KpiCard title="Total de Tickets" qtd={volume.criados} icon={Ticket} />
          <KpiCard
            title="Encerramento Solicitado"
            qtd={volume.encerramentoSolicitado}
            icon={Hourglass}
            url="?status=SOLICITACAO_ENCERRAMENTO"
          />
          <KpiCard
            title="Fora do SLA"
            qtd={resumoSla.foraDoSla}
            icon={TriangleAlert}
          />
          <KpiCard
            title="Próximo do SLA"
            qtd={resumoSla.proximoDoSla}
            icon={Clock8}
          />
        </div>
        <TicketsPerUrgency data={mapUrgenciaParaGrafico(porUrgencia)} />
      </section>

      <section className="flex gap-4">
        <ChartsCardContainer
          title="Tickets abertos por equipe"
          className="min-w-120 w-120 flex-1"
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
          className=" justify-between"
        >
          <TicketsPerSla data={mapSlaParaGrafico(porSla)} />
        </ChartsCardContainer>

        <ChartsCardContainer title="Tickets por Status">
          <TicketsPerStatus
            data={mapStatusParaGrafico(porStatus)}
            total={porStatus.total}
          />
        </ChartsCardContainer>
      </section>

      <section className="pb-8">
        <ChartsCardContainer
          title="SLA Estimado vs. Tempo Real"
          className="w-[50%]"
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
