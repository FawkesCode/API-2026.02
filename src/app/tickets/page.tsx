import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";
import { NovoTicketButton } from "@/components/tickets/novo-ticket-button";
import { getAllTickets } from "@/lib/data/tickets";
import { TicketView } from "@/types/ticket";
import type {
  Categoria,
  Prioridade,
  StatusTicket,
} from "@/lib/generated/prisma/client";

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
  }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const filtros = await searchParams;

  const tickets: TicketView[] = await getAllTickets({
    prioridade: filtros.prioridade as Prioridade | undefined,
    status: filtros.status as StatusTicket | undefined,
    titulo: filtros.titulo,
    data: filtros.data,
    categoria: filtros.tipo as Categoria | undefined,
    projetoId: filtros.projetoId,
    equipeId: filtros.equipeId,
    localInstalacao: filtros.localInstalacao,
  });

  return (
    <div>
      <PageHeader>Tickets</PageHeader>

      <div className="mb-4 flex justify-end">
        <NovoTicketButton />
      </div>

      <section className="flex flex-col gap-4 pb-8">
        <Suspense fallback={null}>
          <TicketFilter />
        </Suspense>
        {tickets.length !== 0 ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              projectId={ticket.projectId ?? ""}
              woLogs={ticket.recentLogs?.length === 0 ? true : false}
            />
          ))
        ) : (
          <p className="col-span-full pl-2 text-sm text-muted-foreground">
            Nenhum ticket cadastrado ainda!
          </p>
        )}
      </section>
    </div>
  );
}