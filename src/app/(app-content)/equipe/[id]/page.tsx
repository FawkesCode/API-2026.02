import PageHeader from "@/components/page-header";
import TicketsLogsView from "@/components/tickets/ticket-logs-view";
import { podeVerMinhaEquipe } from "@/lib/access-control";
import { getTicket } from "@/lib/data/project-ticket";
import { getUsuarioAtual } from "@/lib/data/sessao";
import { TicketView } from "@/types/ticket";
import Link from "next/link";
import { notFound } from "next/navigation";

async function page({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioAtual();
  if (!podeVerMinhaEquipe(usuario?.cargo)) notFound();

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
