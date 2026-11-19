import DashboardFilter from "@/components/dashboard/dashboard-filter";
import DashboardView from "@/components/dashboard/dashboard-view";
import PageHeader from "@/components/page-header";
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <PageHeader>Dashboard</PageHeader>
      <section className="flex flex-col gap-6">
        {/* Tentei manter os filtros que seriam uteis. Os filtros desejados pelo cliente são: cada equipe (todas as equipes como padrão), por usuário, por projeto, por cliente e por data (qnd fiz os mockups, pensei que o por data pegaria sempre o intervalo de um mês). OBS: fiz uma reatoração bem rápida do TicketsFilter para o DashboardFilter, ent pode ser q não esteja 100% */}
        <Suspense fallback={null}>
          <DashboardFilter />
        </Suspense>
        <DashboardView />
      </section>
    </>
  );
}
