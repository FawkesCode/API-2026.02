import { TicketView } from "@/types/ticket";
import TicketFilter from "../ticket-filter";
import TicketCard from "../ticket-card";
import PageHeader from "../page-header";

function MyTeamTickets({ tickets }: { tickets: TicketView[] }) {
  return (
    <>
      <h2 className="-mt-8 mb-8 text-card-foreground text-xl font-medium">
        Tickets em que meu time foi atribuído
      </h2>
      <section className="flex flex-col gap-4 pb-8">
        {/* <TicketFilter /> Botar o mesmo componente de ticket criado pelo nathan     */}
        {tickets.length !== 0 ? (
          tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              ticketUrl={`/equipe/${ticket.id}`}
              woLogs={ticket.recentLogs?.length === 0 ? true : false}
            />
          ))
        ) : (
          <p className="col-span-full pl-2 text-sm text-muted-foreground">
            Nenhum ticket atribuído a sua equipe ainda!
          </p>
        )}
      </section>
    </>
  );
}

export default MyTeamTickets;
