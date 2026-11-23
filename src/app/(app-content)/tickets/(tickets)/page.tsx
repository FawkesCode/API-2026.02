import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { INDICADORES_TICKETS, parseIndicadorTickets } from "@/lib/dashboard-ticket-link";
import { validarFiltrosDashboard } from "@/schemas/dashboard.schema";
import { servicoDashboard } from "@/services/dashboard.service";
import PageHeader from "@/components/page-header";
import TicketCard from "@/components/tickets/ticket-card";
import TicketFilter from "@/components/tickets/ticket-filter";
import { NovoTicketButton } from "@/components/tickets/novo-ticket-button";
import { getAllTickets } from "@/lib/data/tickets";
import type {
  Categoria,
  Prioridade,
  StatusTicket,
} from "@/lib/generated/prisma/client";
import DefaultPagination from "@/components/default-pagination";

interface PageProps {
  searchParams: Promise<{
    prioridade?: string;
    status?: string;
    titulo?: string;
    data?: string;
    dataInicio?: string;
    dataFim?: string;
    clienteId?: string;
    usuarioId?: string;
    indicador?: string;
    tipo?: string;
    projetoId?: string;
    equipeId?: string;
    localInstalacao?: string;
    pagina: number;
    itensPorPagina: number;
  }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const indicador = parseIndicadorTickets(filters.indicador);
  const escopoDashboard = indicador
    ? validarFiltrosDashboard({
        data: filters.data,
        dataInicio: filters.dataInicio,
        dataFim: filters.dataFim,
        equipeId: filters.equipeId,
        projetoId: filters.projetoId,
        clienteId: filters.clienteId,
        usuarioId: filters.usuarioId,
      })
    : undefined;
  if (indicador && !(await getUsuarioAtual())) redirect("/");
  const escopo = indicador
    ? escopoDashboard?.success
      ? await servicoDashboard.whereTicketsDoIndicador(indicador, escopoDashboard.data)
      : { id: { in: [] } }
    : undefined;

  const { itens, total, pagina, totalPaginas, itensPorPagina } =
    await getAllTickets({
      prioridade: filters.prioridade as Prioridade | undefined,
      status: filters.status as StatusTicket | undefined,
      titulo: filters.titulo,
      data: indicador ? undefined : filters.data,
      dataInicio: indicador ? undefined : filters.dataInicio,
      dataFim: indicador ? undefined : filters.dataFim,
      categoria: filters.tipo as Categoria | undefined,
      projetoId: indicador ? undefined : filters.projetoId,
      equipeId: indicador ? undefined : filters.equipeId,
      localInstalacao: filters.localInstalacao,
      pagina: filters.pagina,
      itensPorPagina: filters.itensPorPagina,
    }, escopo);

  return (
    <div>
      <PageHeader other={<NovoTicketButton />}>Tickets</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <Suspense fallback={null}>
          <TicketFilter indicadorDashboard={indicador ? INDICADORES_TICKETS[indicador] : undefined} />
        </Suspense>
        {itens.length !== 0 ? (
          <>
            {itens.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                ticketUrl={`/tickets/${ticket.id}`}
              />
            ))}
            <DefaultPagination
              page={pagina}
              totalPages={totalPaginas}
              total={total}
              itensPerPage={itensPorPagina}
            />
          </>
        ) : (
          <p className="col-span-full pl-2 text-sm text-muted-foreground">
            Nenhum ticket encontrado.
          </p>
        )}
      </section>
    </div>
  );
}
