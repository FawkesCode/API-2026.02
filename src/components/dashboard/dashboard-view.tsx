"use client";

import { Clock8, Hourglass, Ticket, TriangleAlert } from "lucide-react";
import KpiCard from "./kpi-card";
import TicketsPerUrgency from "./tickets-per-urgency";
import ChartsCardContainer from "./charts-card-container";
import TicketsPerTeam from "./tickets-per-team";
import TicketsPerSla from "./tickets-per-sla";
import TicketsPerStatus from "./tickets-per-status";
import EstimatedReal from "./estimated-real";

function DashboardView() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex gap-4 ">
        <div className="grid grid-cols-2 gap-3 shrink-0 min-w-[60%]">
          <KpiCard title="Total de Tickets" qtd={10} icon={Ticket} />
          <KpiCard
            title="Encerramento Solicitado"
            qtd={20}
            icon={Hourglass}
            url="?status=SOLICITACAO_ENCERRAMENTO"
          />
          {/* Acredito que para esses dois, precisa-se de um novo filtro na página de tickets. (Assim como é feito acima, o clique de "ver todos" é feito utilizando os próprios filtros de url da aba ticket) */}
          <KpiCard title="Fora do SLA" qtd={30} icon={TriangleAlert} />
          <KpiCard title="Próximo do SLA" qtd={50} icon={Clock8} />
        </div>
        <TicketsPerUrgency />
      </section>

      <section className="flex gap-4">
        <ChartsCardContainer
          title="Tickets abertos por equipe"
          className="min-w-120 w-120 flex-1"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-6xl text-primary font-bold">45</h2>
            <span className="text-muted-foreground w-[30%]">
              Tickets abertos no mês
            </span>
          </div>
          <TicketsPerTeam />
        </ChartsCardContainer>

        <ChartsCardContainer
          title="Tickets por SLA"
          className=" justify-between"
        >
          <TicketsPerSla />
        </ChartsCardContainer>

        <ChartsCardContainer title="Tickets por Status">
          <TicketsPerStatus />
        </ChartsCardContainer>
      </section>

      <section className="pb-8">
        <ChartsCardContainer
          title="SLA Estimado vs. Tempo Real"
          className="w-[50%]"
        >
          <EstimatedReal />
        </ChartsCardContainer>
      </section>
    </div>
  );
}

export default DashboardView;
