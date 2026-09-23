import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { getTeamsTickets } from "@/lib/data/my-team";
import { TicketView } from "@/types/ticket";

export default async function Team() {
  const loggedUserId = "413de5c1-d1aa-42a5-ad5c-5b1a40de5c98";
  const tickets: TicketView[] = await getTeamsTickets(loggedUserId);

  return (
    <>
      <PageHeader>Minha Equipe</PageHeader>
      <MyTeamTickets tickets={tickets} />
    </>
  );
}
