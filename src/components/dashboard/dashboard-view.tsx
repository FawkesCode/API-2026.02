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
  mapStatusParaGrafico,
  mapUrgenciaParaGrafico,
} from "@/lib/mappers/dashboard.mapper";
import type { AgregacoesVolumeStatusUrgenciaDashboard } from "@/types/dashboard";

interface DashboardViewProps {
  dados: AgregacoesVolumeStatusUrgenciaDashboard;
}

function DashboardView({ dados }: DashboardViewProps) {
  const { volume, porStatus, abertosPorEquipe, porUrgencia } = dados;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex gap-4 flex-col 2xl:flex-row">
        <div className="flex flex-col w-full lg:grid lg:grid-cols-2 gap-3 shrink-0 2xl:w-auto 2xl:min-w-[60%]">
          <KpiCard
            title="Total de Tickets"
            qtd={volume.criados}
            icon={Ticket}
          />
          <KpiCard
            title="Encerramento Solicitado"
            qtd={volume.encerramentoSolicitado}
            icon={Hourglass}
            url="?status=SOLICITACAO_ENCERRAMENTO"
          />
          {/* Acredito que para esses dois, precisa-se de um novo filtro na página de tickets. (Assim como é feito acima, o clique de "ver todos" é feito utilizando os próprios filtros de url da aba ticket) */}
          {/* SLA: valores ainda mockados, falta agregação no back */}
          <KpiCard title="Fora do SLA" qtd={30} icon={TriangleAlert} />
          <KpiCard title="Próximo do SLA" qtd={50} icon={Clock8} />
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

        {/* SLA: ainda mockado */}
        <ChartsCardContainer
          title="Tickets por SLA"
          className=" justify-between lg:w-[50%] lg:ml-2 2xl:w-auto"
        >
          <TicketsPerSla />
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
        {/* SLA: ainda mockado */}
        <ChartsCardContainer
          title="SLA Estimado vs. Tempo Real"
          className="w-full 2xl:w-[50%]"
        >
          <EstimatedReal />
        </ChartsCardContainer>
      </section>
    </div>
  );
}

export default DashboardView;
