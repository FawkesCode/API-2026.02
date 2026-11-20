import { Suspense } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import DashboardFilter from "@/components/dashboard/dashboard-filter";
import DashboardView from "@/components/dashboard/dashboard-view";
import PageHeader from "@/components/page-header";
import { getAgregacoesDashboard } from "@/lib/data/dashboard";
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import type { FiltrosDashboard } from "@/types/dashboard";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Sem nenhuma data na URL, o dashboard mostra o mês vigente.
// Sem equipeId, mostra todas as equipes (o service já trata assim).
function aplicarPeriodoPadrao(filtros: FiltrosDashboard): FiltrosDashboard {
  if (filtros.data || filtros.dataInicio || filtros.dataFim) return filtros;

  const hoje = new Date();
  return {
    ...filtros,
    dataInicio: format(startOfMonth(hoje), "yyyy-MM-dd"),
    dataFim: format(endOfMonth(hoje), "yyyy-MM-dd"),
  };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // Se algum parâmetro vier inválido (link antigo, edição manual na URL),
  // cai nos filtros padrão em vez de quebrar a página.
  const validacao = validarFiltrosDashboard(params);
  const filtros = aplicarPeriodoPadrao(validacao.success ? validacao.data : {});

  const agregacoes = await getAgregacoesDashboard(filtros);

  return (
    <>
      <PageHeader>Dashboard</PageHeader>
      <section className="flex flex-col gap-6">
        {/* Filtros desejados pelo cliente: cada equipe (todas como padrão), por usuário, por projeto, por cliente e por data (padrão: mês vigente). OBS: o DashboardFilter nasceu de uma refatoração rápida do TicketFilter. */}
        <Suspense fallback={null}>
          <DashboardFilter />
        </Suspense>
        <DashboardView dados={agregacoes} />
      </section>
    </>
  );
}