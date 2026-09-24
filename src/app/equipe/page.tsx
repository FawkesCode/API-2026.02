import PageHeader from "@/components/page-header";
import MyTeamTickets from "@/components/tickets/my-team-tickets";
import { getTeamsTickets } from "@/lib/data/my-team";
import { connection } from "next/server";

export default async function Team() {
  // A equipe depende do usuário da requisição e não deve ser renderizada no build.
  await connection();

  // Substituir pela identificação da sessão quando a autenticação for integrada.
  const loggedUserId = "413de5c1-d1aa-42a5-ad5c-5b1a40de5c98";
  const { equipeNome, tickets } = await getTeamsTickets(loggedUserId);

  return (
    <>
      <PageHeader>
        Minha Equipe: <span className="font-light!">{equipeNome}</span>
      </PageHeader>
      <MyTeamTickets tickets={tickets} />
    </>
  );
}
