import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import TicketCard from "@/components/tickets/ticket-card";
import TicketFilter from "@/components/tickets/ticket-filter";
import { getProjectById, getProjectTickets } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import type { Prioridade, StatusTicket } from "@/lib/generated/prisma/client";
import DefaultPagination from "@/components/default-pagination";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    prioridade?: string;
    status?: string;
    titulo?: string;
    data?: string;
    pagina: number;
    itensPorPagina: number;
  }>;
}

async function page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filtros = await searchParams;

  const { title } = await getProjectById(id);
  const { itens, total, pagina, totalPaginas, itensPorPagina } =
    await getProjectTickets(id, {
      prioridade: filtros.prioridade as Prioridade | undefined,
      status: filtros.status as StatusTicket | undefined,
      titulo: filtros.titulo,
      data: filtros.data,
      pagina: filtros.pagina,
      itensPorPagina: filtros.itensPorPagina,
    });

  return (
    <>
      <PageHeader>{`Projeto ${title} > Tickets`}</PageHeader>

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
                ticketUrl={`/projetos/${id}/${ticket.id}`}
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
            Nenhum ticket cadastrado para o projeto {title} ainda!
          </p>
        )}
      </section>
    </>
  );
}

export default page;
