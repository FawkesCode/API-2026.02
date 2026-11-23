import { Suspense } from "react";
import DashboardFilter from "@/components/dashboard/dashboard-filter";
import DashboardView from "@/components/dashboard/dashboard-view";
import PageHeader from "@/components/page-header";
import { getAgregacoesDashboard } from "@/lib/data/dashboard";
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import { applyDefaultDashboardFilters } from "@/services/dashboard.service";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Se algum parâmetro vier inválido (link antigo, edição manual na URL),
  // cai nos filtros padrão em vez de quebrar a página.
  const validacao = validarFiltrosDashboard(params);
  const filtros = applyDefaultDashboardFilters(validacao.success ? validacao.data : {});

  const agregacoes = await getAgregacoesDashboard(filtros);

  return (
    <>
      <PageHeader>Dashboard</PageHeader>
      <section className="flex flex-col gap-6 ">
        {/* Filtros desejados pelo cliente: cada equipe (todas como padrão), por usuário, por projeto, por cliente e por data (padrão: mês vigente). OBS: o DashboardFilter nasceu de uma refatoração rápida do TicketFilter. */}
        <Suspense fallback={null}>
          <DashboardFilter />
        </Suspense>
        <DashboardView dados={agregacoes} filtros={filtros} />
      </section>
    </>
  );
}
