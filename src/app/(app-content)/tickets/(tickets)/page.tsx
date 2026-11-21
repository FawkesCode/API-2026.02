import { Suspense } from "react";
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

  const { itens, total, pagina, totalPaginas, itensPorPagina } =
    await getAllTickets({
      prioridade: filters.prioridade as Prioridade | undefined,
      status: filters.status as StatusTicket | undefined,
      titulo: filters.titulo,
      data: filters.data,
      categoria: filters.tipo as Categoria | undefined,
      projetoId: filters.projetoId,
      equipeId: filters.equipeId,
      localInstalacao: filters.localInstalacao,
      pagina: filters.pagina,
      itensPorPagina: filters.itensPorPagina,
    });

  return (
    <div>
      <PageHeader other={<NovoTicketButton />}>Tickets</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <Suspense fallback={null}>
          <TicketFilter />
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
            Nenhum ticket cadastrado ainda!
          </p>
        )}
      </section>
    </div>
  );
}
