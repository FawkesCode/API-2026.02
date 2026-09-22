import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";
import { getProjectById, getProjectTickets } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import type { Prioridade, StatusTicket } from "@/lib/generated/prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    prioridade?: string;
    status?: string;
    titulo?: string;
    data?: string;
  }>;
}

async function page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filtros = await searchParams;

  const { title } = await getProjectById(id);
  const tickets: TicketView[] = await getProjectTickets(id, {
    prioridade: filtros.prioridade as Prioridade | undefined,
    status: filtros.status as StatusTicket | undefined,
    titulo: filtros.titulo,
    data: filtros.data,
  });

  return (
    <>
      <PageHeader>{`Projeto ${title} > Tickets`}</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <Suspense fallback={null}>
          <TicketFilter />
        </Suspense>
        {tickets.length !== 0 ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              projectId={id}
              woLogs={ticket.recentLogs?.length === 0 ? true : false}
            />
          ))
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