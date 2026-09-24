import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";
import { getProjectById, getProjectTickets } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function page({ params }: PageProps) {
  const { id } = await params;
  const { title } = await getProjectById(id);
  const tickets: TicketView[] = await getProjectTickets(id);

  return (
    <>
      <PageHeader>{`Projeto ${title} > Tickets`}</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <TicketFilter />
        {tickets.length !== 0 ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              ticketUrl={`/projetos/${id}/${ticket.id}`}
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
