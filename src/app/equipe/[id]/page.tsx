import PageHeader from "@/components/page-header";
import TicketsLogsView from "@/components/tickets/ticket-logs-view";
import { getTicket } from "@/lib/data/project-ticket";
import { TicketView } from "@/types/ticket";
import Link from "next/link";

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket: TicketView = await getTicket(id);

  return (
    <div className="flex h-full min-h-0 flex-col pb-6">
      <div className="shrink-0">
        <PageHeader>
          <Link href={`/equipe`} className="hover:underline">
            Minha Equipe
          </Link>
          {` > Ticket ${!ticket ? "Sem título" : ticket.title + " : " + ticket.type}`}
        </PageHeader>
      </div>

      <TicketsLogsView id={id} />
    </div>
  );
}

export default page;
