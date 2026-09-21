import PageHeader from "@/components/page-header";
import TicketCard from "@/components/ticket-card";
import TicketFilter from "@/components/ticket-filter";
import { servicoProjeto } from "@/lib/services/projeto.service";
import { formatTicket, TicketView } from "@/utils/formatTickets";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function page({ params }: PageProps) {
  const { id } = await params;
  const projectInfo = await servicoProjeto.buscarDetalhePorId(id);
  if (!projectInfo) return;

  const projectWTicket =
    await servicoProjeto.buscarProjetoComTicketDeInstalacao(id);
  const ticket = projectWTicket?.ticketInstalacao;

  const formatedTicket = ticket
    ? formatTicket(ticket, projectInfo?.equipe.nome, projectInfo.gestor.nome)
    : null;
  const tickets: TicketView[] = formatedTicket ? [formatedTicket] : [];

  return (
    <>
      <PageHeader>{`Projeto ${projectInfo?.nome} > Tickets`}</PageHeader>

      <section className="flex flex-col gap-4 pb-8">
        <TicketFilter />
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
          <p className="col-span-full text-sm text-muted-foreground">
            Nenhum ticket cadastrado para o projeto #{id} ainda!
          </p>
        )}
      </section>
    </>
  );
}

export default page;
